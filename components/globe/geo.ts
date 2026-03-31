import * as THREE from 'three'
import earcut from 'earcut'
import { feature, mesh } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { GLOBE_TUNING, PALETTE } from './tuning'
import { toSphere, preprocessRing } from './utils'

// Normalize a ring: remove duplicate end-point if it matches the first
function normalizeRing(coords: number[][]): number[][] {
  if (coords.length < 2) return coords
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) {
    return coords.slice(0, -1)
  }
  return coords
}

// Densify a ring by subdividing edges longer than maxDeg degrees
// This is critical for large countries (Russia, Canada, USA) so sphere
// projection doesn't produce degenerate/bowed triangles
function densifyRing(coords: number[][], maxDeg = 5): number[][] {
  const out: number[][] = []
  for (let i = 0; i < coords.length; i++) {
    const a = coords[i]
    const b = coords[(i + 1) % coords.length]
    out.push(a)
    const dLng = b[0] - a[0]
    const dLat = b[1] - a[1]
    const dist = Math.sqrt(dLng * dLng + dLat * dLat)
    if (dist > maxDeg) {
      const steps = Math.ceil(dist / maxDeg)
      for (let s = 1; s < steps; s++) {
        const t = s / steps
        out.push([a[0] + dLng * t, a[1] + dLat * t])
      }
    }
  }
  return out
}

export function buildLandMeshes(world: Topology, R: number): THREE.Mesh[] {
  const countries = feature(
    world,
    (world.objects as Record<string, GeometryCollection>).countries,
  )

  const meshes: THREE.Mesh[] = []
  // Land: DoubleSide critical — sphere projection can flip triangle winding
  // polygonOffset prevents z-fighting with the base sphere
  const material = new THREE.MeshPhongMaterial({
    color: PALETTE.landFill,
    shininess: 6,
    specular: new THREE.Color(0x1a1512),
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })

  for (const country of countries.features) {
    const geom = country.geometry
    if (!geom) continue

    const polygons: number[][][][] =
      geom.type === 'Polygon'
        ? [geom.coordinates as number[][][]]
        : geom.type === 'MultiPolygon'
        ? (geom.coordinates as number[][][][])
        : []

    for (const polygon of polygons) {
      if (polygon.length === 0) continue

      const rawOuter = polygon[0]
      // Densify at 3° — finer subdivision for large countries (Russia, Canada, USA)
      const outerRing = densifyRing(preprocessRing(normalizeRing(rawOuter)), 3)
      if (outerRing.length < 3) continue

      const holes = polygon.slice(1)
        .map(h => densifyRing(preprocessRing(normalizeRing(h)), 3))
        .filter(h => h.length >= 3)

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

      if (indices.length === 0) continue

      const positions: number[] = []
      const normals: number[] = []

      for (let i = 0; i < indices.length; i++) {
        const idx = indices[i]
        const lng = flatCoords[idx * 2]
        const lat = flatCoords[idx * 2 + 1]
        const v = toSphere(lat, lng, R + GLOBE_TUNING.landOffset)
        positions.push(v.x, v.y, v.z)
        // Normal always points radially outward from sphere center
        const n = v.clone().normalize()
        normals.push(n.x, n.y, n.z)
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
      // Let Three.js also compute face normals as a safety net
      geometry.computeBoundingSphere()

      meshes.push(new THREE.Mesh(geometry, material))
    }
  }

  return meshes
}

export function buildCoastlines(world: Topology, R: number): THREE.LineSegments {
  const coastMesh = mesh(
    world,
    (world.objects as Record<string, GeometryCollection>).countries,
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

  // Coastlines: eye reads these first — raised another 12%
  const material = new THREE.LineBasicMaterial({
    color: PALETTE.coastline,
    transparent: true,
    opacity: 0.72,
    linewidth: 1,
  })

  return new THREE.LineSegments(geometry, material)
}

export function buildBorders(world: Topology, R: number): THREE.LineSegments {
  // Interior borders between countries only
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

  // Borders: discoverable on inspection, never leads — reduced another 12%
  const material = new THREE.LineBasicMaterial({
    color: PALETTE.borders,
    linewidth: 1,
    transparent: true,
    opacity: 0.14,
  })

  return new THREE.LineSegments(geometry, material)
}

export function buildGraticule(R: number): THREE.LineSegments {
  const positions: number[] = []
  const step = 10 // 10-degree graticule
  const segments = 180

  // Longitude lines
  for (let lng = -180; lng < 180; lng += step) {
    for (let i = 0; i < segments; i++) {
      const lat1 = -90 + (i / segments) * 180
      const lat2 = -90 + ((i + 1) / segments) * 180
      const v1 = toSphere(lat1, lng, R + GLOBE_TUNING.graticuleOffset)
      const v2 = toSphere(lat2, lng, R + GLOBE_TUNING.graticuleOffset)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  // Latitude lines
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

  // Graticule: precision texture only — reduced another 22%
  const material = new THREE.LineBasicMaterial({
    color: PALETTE.graticule,
    linewidth: 1,
    transparent: true,
    opacity: 0.048,
  })

  return new THREE.LineSegments(geometry, material)
}
