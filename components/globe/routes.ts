import * as THREE from 'three'
import { GLOBE_TUNING, PALETTE } from './tuning'
import { toSphere, greatCircleDistance, arcLift } from './utils'

export interface NodeMap {
  [id: string]: { lat: number; lng: number }
}

export interface ArcWaveRing {
  mesh: THREE.Mesh
  mat: THREE.MeshBasicMaterial
  offsetT: number   // trailing offset along arc (0 = leading, negative = behind)
  baseOpacity: number
}

export interface RouteObject {
  tube: THREE.Mesh
  glowTube: THREE.Mesh
  // Legacy pulse sphere (hidden, kept for compatibility)
  pulse: THREE.Mesh
  pulseMat: THREE.MeshBasicMaterial
  // Arc wave rings (replaces single pulse sphere)
  waveRings: ArcWaveRing[]
  curve: THREE.QuadraticBezierCurve3
  points: THREE.Vector3[]
  offset: number
}

// Arc wave constants
const WAVE_OFFSETS = [0, -0.04, -0.08]    // leading ring first, trailing behind
const WAVE_OPACITIES = [1.0, 0.55, 0.28]  // leading brightest

export function buildRoutes(nodes: NodeMap, routes: ({ id: string; from: string; to: string } | string[])[]): RouteObject[] {
  const result: RouteObject[] = []
  const R = GLOBE_TUNING.radius

  routes.forEach((pair, idx) => {
    const idA = Array.isArray(pair) ? pair[0] : pair.from
    const idB = Array.isArray(pair) ? pair[1] : pair.to
    const nodeA = nodes[idA]
    const nodeB = nodes[idB]
    if (!nodeA || !nodeB) return

    const v1 = toSphere(nodeA.lat, nodeA.lng, R)
    const v2 = toSphere(nodeB.lat, nodeB.lng, R)

    const dist = greatCircleDistance(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng)
    const lift = arcLift(dist, GLOBE_TUNING)

    // Midpoint elevated above sphere surface
    const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5)
    const midLen = mid.length()
    mid.normalize().multiplyScalar(midLen + lift)

    const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2)
    const points = curve.getPoints(128)

    // ── Tube ─────────────────────────────────────────────────────────────────
    const tubeGeom = new THREE.TubeGeometry(curve, 64, GLOBE_TUNING.routes.tubeRadius, 6, false)
    const tubeMat = new THREE.MeshBasicMaterial({
      color: PALETTE.routeBody,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
    const tube = new THREE.Mesh(tubeGeom, tubeMat)

    // ── Glow tube ─────────────────────────────────────────────────────────────
    const glowGeom = new THREE.TubeGeometry(curve, 64, 0.008, 6, false)
    const glowMat = new THREE.MeshBasicMaterial({
      color: '#9dbfff',
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const glowTube = new THREE.Mesh(glowGeom, glowMat)

    // ── Legacy pulse sphere (hidden — wave rings take over) ───────────────────
    const pulseGeom = new THREE.SphereGeometry(GLOBE_TUNING.routes.pulseRadius, 8, 8)
    const pulseMat = new THREE.MeshBasicMaterial({
      color: PALETTE.routePulse,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const pulse = new THREE.Mesh(pulseGeom, pulseMat)
    pulse.position.copy(points[0])
    // Keep pulse always hidden — wave rings do the job
    pulseMat.opacity = 0

    // ── Arc wave rings ────────────────────────────────────────────────────────
    // Created without group reference — caller adds them to scene
    const waveRings: ArcWaveRing[] = WAVE_OFFSETS.map((offset, i) => {
      const ringRadius = GLOBE_TUNING.routes.pulseRadius * 1.2
      const geo = new THREE.RingGeometry(0.001, ringRadius, 24)
      const mat = new THREE.MeshBasicMaterial({
        color: PALETTE.routePulse,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(points[0])
      return { mesh, mat, offsetT: offset, baseOpacity: WAVE_OPACITIES[i] }
    })

    result.push({
      tube,
      glowTube,
      pulse,
      pulseMat,
      waveRings,
      curve,
      points,
      offset: idx * 1100,
    })
  })

  return result
}
