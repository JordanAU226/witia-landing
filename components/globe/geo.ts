import * as THREE from 'three'
import earcut from 'earcut'
import { feature, mesh, merge } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { GLOBE_TUNING, PALETTE } from './tuning'
import { toSphere } from './utils'

type LonLat = [number, number]

function normalizeRing(coords: number[][]): number[][] {
  if (coords.length < 2) return coords
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) {
    return coords.slice(0, -1)
  }
  return coords
}

// Antimeridian unwrap — critical for Russia, Fiji, Alaska etc.
function preprocessRing(coords: number[][]): number[][] {
  if (coords.length === 0) return coords
  const result: number[][] = [coords[0].slice()]
  for (let i = 1; i < coords.length; i++) {
    const prev = result[i - 1]
    const curr = coords[i].slice()
    let dLng = curr[0] - prev[0]
    if (dLng > 180) curr[0] -= 360
    else if (dLng < -180) curr[0] += 360
    result.push(curr)
  }
  return result
}

export function buildLandMeshes(world: Topology, R: number): THREE.Mesh[] {
  const objects = world.objects as Record<string, any>
  const countriesObject = objects.countries

  // Use merged landmass fill — avoids per-country border artifacts
  const landGeometry = objects.land
    ? (feature(world, objects.land) as any).geometry
    : merge(world, countriesObject.geometries as any)

  const polygons: number[][][][] =
    landGeometry.type === 'Polygon'
      ? [landGeometry.coordinates as number[][][]]
      : landGeometry.type === 'MultiPolygon'
      ? (landGeometry.coordinates as number[][][][])
      : []

  const meshes: THREE.Mesh[] = []

  const material = new THREE.MeshPhongMaterial({
    color: PALETTE.landFill,
    shininess: 6,
    specular: new THREE.Color(0x1a1512),
    side: THREE.FrontSide, // FrontSide now safe — winding is corrected below
  })

  for (const polygon of polygons) {
    if (!polygon.length) continue

    const rawOuter = polygon[0]
    const outerRing = preprocessRing(normalizeRing(rawOuter))
    if (outerRing.length < 3) continue

    const holes = polygon
      .slice(1)
      .map((ring) => preprocessRing(normalizeRing(ring)))
      .filter((ring) => ring.length >= 3)

    const flatCoords: number[] = []
    const holeIndices: number[] = []

    for (const [lng, lat] of outerRing) {
      flatCoords.push(lng, lat)
    }

    for (const hole of holes) {
      holeIndices.push(flatCoords.length / 2)
      for (const [lng, lat] of hole) {
        flatCoords.push(lng, lat)
      }
    }

    let indices: number[]
    try {
      indices = earcut(flatCoords, holeIndices.length ? holeIndices : undefined, 2)
    } catch {
      continue
    }

    if (indices.length < 3) continue

    const positions: number[] = []
    const normals: number[] = []

    for (let i = 0; i < indices.length; i += 3) {
      const ia = indices[i] * 2
      const ib = indices[i + 1] * 2
      const ic = indices[i + 2] * 2

      let a = toSphere(flatCoords[ia + 1], flatCoords[ia], R + GLOBE_TUNING.landOffset)
      let b = toSphere(flatCoords[ib + 1], flatCoords[ib], R + GLOBE_TUNING.landOffset)
      let c = toSphere(flatCoords[ic + 1], flatCoords[ic], R + GLOBE_TUNING.landOffset)

      // Fix winding after projection to sphere.
      // earcut guarantees CCW in 2D, but sphere projection can flip triangles.
      // Check face normal against outward direction and correct if flipped.
      const ab = new THREE.Vector3().subVectors(b, a)
      const ac = new THREE.Vector3().subVectors(c, a)
      const faceNormal = new THREE.Vector3().crossVectors(ab, ac)
      const outward = new THREE.Vector3()
        .addVectors(a, b)
        .add(c)
        .multiplyScalar(1 / 3)
        .normalize()

      if (faceNormal.dot(outward) < 0) {
        ;[b, c] = [c, b]
      }

      for (const v of [a, b, c]) {
        positions.push(v.x, v.y, v.z)
        const n = v.clone().normalize()
        normals.push(n.x, n.y, n.z)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))

    meshes.push(new THREE.Mesh(geometry, material))
  }

  return meshes
}

// Coastlines: outer boundaries only using (a, b) => a === b
// This returns only coastlines (boundaries where a country meets itself / ocean)
// NOT interior borders between countries
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
    linewidth: 1,
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
    linewidth: 1,
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
      const v1 = toSphere(lat1, lng, R + GLOBE_TUNING.graticuleOffset)
      const v2 = toSphere(lat2, lng, R + GLOBE_TUNING.graticuleOffset)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  for (let lat = -80; lat <= 80; lat += step) {
    for (let i = 0; i < segments * 2; i++) {
      const lng1 = -180 + (i / (segments * 2)) * 360
      const lng2 = -180 + ((i + 1) / (segments * 2)) * 360
      const v1 = toSphere(lat, lng1, R + GLOBE_TUNING.graticuleOffset)
      const v2 = toSphere(lat, lng2, R + GLOBE_TUNING.graticuleOffset)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: PALETTE.graticule,
    linewidth: 1,
    transparent: true,
    opacity: 0.048,
  })

  return new THREE.LineSegments(geometry, material)
}
