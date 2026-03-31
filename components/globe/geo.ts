import * as THREE from 'three'
import earcut from 'earcut'
import { feature, mesh } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { GLOBE_TUNING, PALETTE } from './tuning'
import { toSphere, preprocessRing } from './utils'

type LonLat = [number, number]

// Remove duplicate closing point from a GeoJSON ring
function removeDuplicateClosingPoint(ring: LonLat[]): LonLat[] {
  if (ring.length < 2) return ring
  const [firstLng, firstLat] = ring[0]
  const [lastLng, lastLat] = ring[ring.length - 1]
  if (firstLng === lastLng && firstLat === lastLat) {
    return ring.slice(0, -1)
  }
  return ring
}

// Unwrap ring to prevent antimeridian seam issues
// Ensures consecutive longitudes never jump more than 180°
// Critical for Russia, Fiji, Alaska, Kiribati etc.
function unwrapRing(ring: LonLat[]): LonLat[] {
  if (ring.length === 0) return ring
  const out: LonLat[] = [[ring[0][0], ring[0][1]]]
  for (let i = 1; i < ring.length; i++) {
    let [lng, lat] = ring[i]
    const prevLng = out[i - 1][0]
    while (lng - prevLng > 180) lng -= 360
    while (lng - prevLng < -180) lng += 360
    out.push([lng, lat])
  }
  return out
}

// Build a single polygon (outer ring + holes) into a BufferGeometry
// Critical: earcut triangulates in 2D lon/lat space FIRST, then we project to sphere
function buildPolygonGeometry(
  polygon: LonLat[][],
  radius: number,
): THREE.BufferGeometry | null {
  if (!polygon.length) return null

  const vertices2D: number[] = []
  const holeIndices: number[] = []

  polygon.forEach((ring, ringIndex) => {
    if (!ring || ring.length < 4) return

    const cleaned = unwrapRing(
      removeDuplicateClosingPoint(ring)
    )
    if (cleaned.length < 3) return

    if (ringIndex > 0) {
      holeIndices.push(vertices2D.length / 2)
    }

    for (const [lng, lat] of cleaned) {
      vertices2D.push(lng, lat)
    }
  })

  if (vertices2D.length < 6) return null

  let indices: number[]
  try {
    indices = earcut(vertices2D, holeIndices.length ? holeIndices : undefined, 2)
  } catch {
    return null
  }

  if (!indices.length) return null

  // Pre-compute sphere points for each 2D vertex
  const sphereVerts: THREE.Vector3[] = []
  for (let i = 0; i < vertices2D.length; i += 2) {
    const lng = vertices2D[i]
    const lat = vertices2D[i + 1]
    sphereVerts.push(toSphere(lat, lng, radius))
  }

  const positions: number[] = []
  const normals: number[] = []

  for (let i = 0; i < indices.length; i += 3) {
    const a = sphereVerts[indices[i]]
    const b = sphereVerts[indices[i + 1]]
    const c = sphereVerts[indices[i + 2]]

    for (const p of [a, b, c]) {
      positions.push(p.x, p.y, p.z)
      const n = p.clone().normalize()
      normals.push(n.x, n.y, n.z)
    }
  }

  if (positions.length === 0) return null

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.computeBoundingSphere()

  return geometry
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
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })

  const R_land = R + GLOBE_TUNING.landOffset

  for (const country of countries.features) {
    const geom = country.geometry
    if (!geom) continue

    // Collect all polygons (handles both Polygon and MultiPolygon)
    const polygons: LonLat[][][] = []

    if (geom.type === 'Polygon') {
      polygons.push(geom.coordinates as LonLat[][])
    } else if (geom.type === 'MultiPolygon') {
      polygons.push(...(geom.coordinates as LonLat[][][]))
    }

    for (const polygon of polygons) {
      const geometry = buildPolygonGeometry(polygon, R_land)
      if (!geometry) continue
      meshes.push(new THREE.Mesh(geometry, material))
    }
  }

  return meshes
}

// Returns an array of LineLoop objects (one per outer ring) for accurate coastlines
export function buildCoastlines(world: Topology, R: number): THREE.Group {
  const countries = feature(
    world,
    (world.objects as Record<string, GeometryCollection>).countries,
  )

  const group = new THREE.Group()
  const material = new THREE.LineBasicMaterial({
    color: PALETTE.coastline,
    transparent: true,
    opacity: 0.72,
    linewidth: 1,
  })

  const R_coast = R + GLOBE_TUNING.coastOffset

  for (const country of countries.features) {
    const geom = country.geometry
    if (!geom) continue

    const polygons: LonLat[][][] =
      geom.type === 'Polygon'
        ? [geom.coordinates as LonLat[][]]
        : geom.type === 'MultiPolygon'
        ? (geom.coordinates as LonLat[][][])
        : []

    for (const polygon of polygons) {
      const outerRing = polygon[0]
      if (!outerRing || outerRing.length < 2) continue

      const cleaned = unwrapRing(removeDuplicateClosingPoint(outerRing))
      const pts = cleaned.map(([lng, lat]) => toSphere(lat, lng, R_coast))

      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      group.add(new THREE.LineLoop(geo, material))
    }
  }

  return group
}

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

  // Borders: discoverable on inspection, never leads
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

  // Graticule: precision texture only
  const material = new THREE.LineBasicMaterial({
    color: PALETTE.graticule,
    linewidth: 1,
    transparent: true,
    opacity: 0.048,
  })

  return new THREE.LineSegments(geometry, material)
}
