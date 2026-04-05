import * as THREE from 'three'
import earcut from 'earcut'
import { feature, mesh } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { GLOBE_TUNING, PALETTE } from './tuning'
import { toSphere } from './utils'

type Ring = number[][]
type PolygonRings = number[][][]

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

// Remove duplicated closing point if present
function normalizeRing(coords: Ring): Ring {
  if (coords.length < 2) return coords
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) {
    return coords.slice(0, -1)
  }
  return coords
}

// Build a local tangent-plane basis for one polygon.
// This avoids antimeridian and polar triangulation artifacts that
// happen when earcut is fed raw lon/lat directly.
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
  const projected: ProjectedVertex[] = []
  for (const [lng, lat] of ring) {
    const unit = toSphere(lat, lng, 1)
    projected.push({
      x: unit.dot(basis.tangent),
      y: unit.dot(basis.bitangent),
      sphere: unit.clone().multiplyScalar(radius),
    })
  }
  return projected
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

  // Outer ring CCW, holes CW for earcut stability
  const outerRing = ensureWinding(
    projectRingToLocalPlane(outerSource, basis, radius),
    false,
  )

  const holeRings = polygon
    .slice(1)
    .map((ring) => normalizeRing(ring))
    .filter((ring) => ring.length >= 3)
    .map((ring) =>
      ensureWinding(projectRingToLocalPlane(ring, basis, radius), true),
    )

  const flatCoords: number[] = []
  const holeIndices: number[] = []
  const sphereVertices: THREE.Vector3[] = []

  const appendRing = (ring: ProjectedVertex[], isHole: boolean) => {
    if (isHole) {
      holeIndices.push(sphereVertices.length)
    }
    for (const v of ring) {
      flatCoords.push(v.x, v.y)
      sphereVertices.push(v.sphere)
    }
  }

  appendRing(outerRing, false)
  for (const hole of holeRings) {
    appendRing(hole, true)
  }

  return { flatCoords, holeIndices, sphereVertices }
}

export function buildLandMeshes(world: Topology, R: number): THREE.Mesh[] {
  const countries = feature(
    world,
    (world.objects as Record<string, GeometryCollection>).countries,
  )

  const meshes: THREE.Mesh[] = []
  const material = new THREE.MeshPhongMaterial({
    color: PALETTE.landFill,
    shininess: 6,
    specular: new THREE.Color(0x1a1512),
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })

  const R_land = R + GLOBE_TUNING.landOffset

  for (const country of countries.features) {
    const geom = country.geometry
    if (!geom) continue

    const polygons: PolygonRings[] =
      geom.type === 'Polygon'
        ? [geom.coordinates as PolygonRings]
        : geom.type === 'MultiPolygon'
        ? (geom.coordinates as PolygonRings[])
        : []

    for (const polygon of polygons) {
      const flat = flattenProjectedPolygon(polygon, R_land)
      if (!flat) continue

      const { flatCoords, holeIndices, sphereVertices } = flat

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

      const positions: number[] = []
      const normals: number[] = []

      for (const idx of indices) {
        const v = sphereVertices[idx]
        positions.push(v.x, v.y, v.z)
        const n = v.clone().normalize()
        normals.push(n.x, n.y, n.z)
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3),
      )
      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(normals, 3),
      )
      meshes.push(new THREE.Mesh(geometry, material))
    }
  }

  return meshes
}

// Coastlines: outer boundaries only
export function buildCoastlines(world: Topology, R: number): THREE.LineSegments {
  const coastMesh = mesh(
    world,
    (world.objects as Record<string, GeometryCollection>).countries,
    (a, b) => a === b,
  )

  const positions: number[] = []
  for (const coord of coastMesh.coordinates) {
    for (let i = 0; i < coord.length - 1; i++) {
      const [lng1, lat1] = coord[i]
      const [lng2, lat2] = coord[i + 1]
      const v1 = toSphere(lat1, lng1, R + GLOBE_TUNING.coastOffset)
      const v2 = toSphere(lat2, lng2, R + GLOBE_TUNING.coastOffset)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: PALETTE.coastline,
    transparent: true,
    opacity: 0.72,
  })

  return new THREE.LineSegments(geometry, material)
}

// Country borders (interior boundaries only)
export function buildBorders(world: Topology, R: number): THREE.LineSegments {
  const borderMesh = mesh(
    world,
    (world.objects as Record<string, GeometryCollection>).countries,
    (a, b) => a !== b,
  )

  const positions: number[] = []
  for (const coord of borderMesh.coordinates) {
    for (let i = 0; i < coord.length - 1; i++) {
      const [lng1, lat1] = coord[i]
      const [lng2, lat2] = coord[i + 1]
      const v1 = toSphere(lat1, lng1, R + GLOBE_TUNING.borderOffset)
      const v2 = toSphere(lat2, lng2, R + GLOBE_TUNING.borderOffset)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: PALETTE.borders,
    transparent: true,
    opacity: 0.14,
  })

  return new THREE.LineSegments(geometry, material)
}

// Graticule
export function buildGraticule(R: number): THREE.LineSegments {
  const positions: number[] = []
  const step = 10
  const segments = 180

  for (let lng = -180; lng < 180; lng += step) {
    for (let i = 0; i < segments; i++) {
      const lat1 = -90 + (i / segments) * 180
      const lat2 = -90 + ((i + 1) / segments) * 180
      positions.push(
        ...toSphere(lat1, lng, R + GLOBE_TUNING.graticuleOffset).toArray(),
        ...toSphere(lat2, lng, R + GLOBE_TUNING.graticuleOffset).toArray(),
      )
    }
  }

  for (let lat = -80; lat <= 80; lat += step) {
    for (let i = 0; i < segments * 2; i++) {
      const lng1 = -180 + (i / (segments * 2)) * 360
      const lng2 = -180 + ((i + 1) / (segments * 2)) * 360
      positions.push(
        ...toSphere(lat, lng1, R + GLOBE_TUNING.graticuleOffset).toArray(),
        ...toSphere(lat, lng2, R + GLOBE_TUNING.graticuleOffset).toArray(),
      )
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: PALETTE.graticule,
    transparent: true,
    opacity: 0.048,
  })

  return new THREE.LineSegments(geometry, material)
}
