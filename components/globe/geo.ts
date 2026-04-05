import * as THREE from 'three'
import earcut from 'earcut'
import { feature, mesh, merge } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { GLOBE_TUNING, PALETTE } from './tuning'
import { toSphere } from './utils'

type Ring = number[][]
type PolygonRings = number[][][]
type MultiPolygonRings = number[][][][]

type ProjectionBasis = {
  center: THREE.Vector3
  tangent: THREE.Vector3
  bitangent: THREE.Vector3
}

type ProjectedVertex = {
  x: number
  y: number
  sphere: THREE.Vector3
}

function normalizeRing(coords: Ring): Ring {
  if (coords.length < 2) return coords
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) {
    return coords.slice(0, -1)
  }
  return coords
}

function computeProjectionBasis(ring: Ring): ProjectionBasis | null {
  if (ring.length < 3) return null

  const center = new THREE.Vector3()
  for (const [lng, lat] of ring) {
    const unit = toSphere(lat, lng, 1)
    center.add(unit)
  }

  if (center.lengthSq() < 1e-8) {
    const [lng, lat] = ring[0]
    center.copy(toSphere(lat, lng, 1))
  }
  center.normalize()

  const reference =
    Math.abs(center.y) > 0.9
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0)

  const tangent = new THREE.Vector3().crossVectors(reference, center).normalize()
  const bitangent = new THREE.Vector3().crossVectors(center, tangent).normalize()

  return { center, tangent, bitangent }
}

function projectRingToLocalPlane(
  ring: Ring,
  basis: ProjectionBasis,
  radius: number,
): ProjectedVertex[] {
  return ring.map(([lng, lat]) => {
    const unit = toSphere(lat, lng, 1)
    return {
      x: unit.dot(basis.tangent),
      y: unit.dot(basis.bitangent),
      sphere: unit.clone().multiplyScalar(radius),
    }
  })
}

function signedArea2D(ring: ProjectedVertex[]): number {
  let area = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    area += a.x * b.y - b.x * a.y
  }
  return area * 0.5
}

function ensureWinding(
  ring: ProjectedVertex[],
  wantClockwise: boolean,
): ProjectedVertex[] {
  const isClockwise = signedArea2D(ring) < 0
  return isClockwise === wantClockwise ? ring : [...ring].reverse()
}

function flattenProjectedPolygon(
  polygon: PolygonRings,
  radius: number,
): { flatCoords: number[]; holeIndices: number[]; sphereVertices: THREE.Vector3[] } | null {
  if (!polygon.length) return null

  const outerSource = normalizeRing(polygon[0])
  if (outerSource.length < 3) return null

  const basis = computeProjectionBasis(outerSource)
  if (!basis) return null

  const outerRing = ensureWinding(
    projectRingToLocalPlane(outerSource, basis, radius),
    false, // CCW
  )

  const holeRings = polygon
    .slice(1)
    .map((ring) => normalizeRing(ring))
    .filter((ring) => ring.length >= 3)
    .map((ring) =>
      ensureWinding(projectRingToLocalPlane(ring, basis, radius), true), // CW
    )

  const flatCoords: number[] = []
  const holeIndices: number[] = []
  const sphereVertices: THREE.Vector3[] = []

  const appendRing = (ring: ProjectedVertex[], isHole: boolean) => {
    if (isHole) holeIndices.push(sphereVertices.length)
    for (const v of ring) {
      flatCoords.push(v.x, v.y)
      sphereVertices.push(v.sphere)
    }
  }

  appendRing(outerRing, false)
  for (const hole of holeRings) appendRing(hole, true)

  return { flatCoords, holeIndices, sphereVertices }
}

// After triangulation in 2D, project back to the sphere and fix triangle winding
// so front-face culling doesn't create false holes.
function pushSphericalTriangle(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  positions: number[],
  normals: number[],
) {
  const ab = new THREE.Vector3().subVectors(b, a)
  const ac = new THREE.Vector3().subVectors(c, a)
  const faceNormal = new THREE.Vector3().crossVectors(ab, ac)

  const outward = new THREE.Vector3()
    .addVectors(a, b)
    .add(c)
    .multiplyScalar(1 / 3)
    .normalize()

  const tri = faceNormal.dot(outward) < 0 ? [a, c, b] : [a, b, c]

  for (const v of tri) {
    positions.push(v.x, v.y, v.z)
    const n = v.clone().normalize()
    normals.push(n.x, n.y, n.z)
  }
}

function getLandPolygons(world: Topology): MultiPolygonRings {
  const objects = world.objects as Record<string, any>
  const countriesObject = objects.countries

  const landGeometry = objects.land
    ? (feature(world, objects.land) as any).geometry
    : merge(world, countriesObject.geometries as any)

  if (!landGeometry) return []

  if (landGeometry.type === 'Polygon') {
    return [landGeometry.coordinates as PolygonRings]
  }
  if (landGeometry.type === 'MultiPolygon') {
    return landGeometry.coordinates as MultiPolygonRings
  }
  return []
}

export function buildLandMeshes(world: Topology, R: number): THREE.Mesh[] {
  const polygons = getLandPolygons(world)
  if (!polygons.length) return []

  const landRadius = R + GLOBE_TUNING.landOffset

  const positions: number[] = []
  const normals: number[] = []

  for (const polygon of polygons) {
    const flattened = flattenProjectedPolygon(polygon, landRadius)
    if (!flattened) continue

    const { flatCoords, holeIndices, sphereVertices } = flattened

    let indices: number[]
    try {
      indices = earcut(
        flatCoords,
        holeIndices.length ? holeIndices : undefined,
        2,
      )
    } catch {
      continue
    }

    if (indices.length < 3) continue

    for (let i = 0; i < indices.length; i += 3) {
      const a = sphereVertices[indices[i]]
      const b = sphereVertices[indices[i + 1]]
      const c = sphereVertices[indices[i + 2]]
      if (!a || !b || !c) continue
      pushSphericalTriangle(a, b, c, positions, normals)
    }
  }

  if (positions.length === 0) return []

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.computeBoundingSphere()

  const material = new THREE.MeshStandardMaterial({
    color: PALETTE.landFill,
    roughness: 0.8,
    metalness: 0.0,
    transparent: true,
    opacity: 0.98,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })

  return [new THREE.Mesh(geometry, material)]
}

// Coastlines only
export function buildCoastlines(world: Topology, R: number): THREE.LineSegments {
  const objects = world.objects as Record<string, any>
  const countriesObject = objects.countries as GeometryCollection

  const coastMesh = objects.land
    ? mesh(world, objects.land as any)
    : mesh(world, countriesObject, (a, b) => a === b)

  const positions: number[] = []
  const r = R + GLOBE_TUNING.coastOffset

  for (const coord of coastMesh.coordinates) {
    for (let i = 0; i < coord.length - 1; i++) {
      const [lng1, lat1] = coord[i]
      const [lng2, lat2] = coord[i + 1]
      const v1 = toSphere(lat1, lng1, r)
      const v2 = toSphere(lat2, lng2, r)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: PALETTE.coastline,
    transparent: true,
    opacity: 0.58,
    linewidth: 1,
    depthWrite: false,
  })

  return new THREE.LineSegments(geometry, material)
}

// Country borders only
export function buildBorders(world: Topology, R: number): THREE.LineSegments {
  const countriesObject = (world.objects as Record<string, GeometryCollection>).countries

  const borderMesh = mesh(world, countriesObject, (a, b) => a !== b)

  const positions: number[] = []
  const r = R + GLOBE_TUNING.borderOffset

  for (const coord of borderMesh.coordinates) {
    for (let i = 0; i < coord.length - 1; i++) {
      const [lng1, lat1] = coord[i]
      const [lng2, lat2] = coord[i + 1]
      const v1 = toSphere(lat1, lng1, r)
      const v2 = toSphere(lat2, lng2, r)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: PALETTE.borders,
    linewidth: 1,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  })

  return new THREE.LineSegments(geometry, material)
}

export function buildGraticule(R: number): THREE.LineSegments {
  const positions: number[] = []
  const step = 10
  const segments = 180
  const r = R + GLOBE_TUNING.graticuleOffset

  for (let lng = -180; lng < 180; lng += step) {
    for (let i = 0; i < segments; i++) {
      const lat1 = -90 + (i / segments) * 180
      const lat2 = -90 + ((i + 1) / segments) * 180
      const v1 = toSphere(lat1, lng, r)
      const v2 = toSphere(lat2, lng, r)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  for (let lat = -80; lat <= 80; lat += step) {
    for (let i = 0; i < segments * 2; i++) {
      const lng1 = -180 + (i / (segments * 2)) * 360
      const lng2 = -180 + ((i + 1) / (segments * 2)) * 360
      const v1 = toSphere(lat, lng1, r)
      const v2 = toSphere(lat, lng2, r)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: PALETTE.graticule,
    linewidth: 1,
    transparent: true,
    opacity: 0.038,
    depthWrite: false,
  })

  return new THREE.LineSegments(geometry, material)
}
