import * as THREE from 'three'
import { GLOBE_TUNING, PALETTE } from './tuning'
import { toSphere, greatCircleDistance, arcLift } from './utils'

export interface NodeMap {
  [id: string]: { lat: number; lng: number }
}

export interface RouteObject {
  tube: THREE.Mesh
  glowTube: THREE.Mesh
  pulse: THREE.Mesh
  pulseMat: THREE.MeshBasicMaterial
  curve: THREE.QuadraticBezierCurve3
  points: THREE.Vector3[]
  offset: number
}

export function buildRoutes(nodes: NodeMap, routes: string[][]): RouteObject[] {
  const result: RouteObject[] = []
  const R = GLOBE_TUNING.radius

  routes.forEach((pair, idx) => {
    const [idA, idB] = pair
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

    // ── Pulse sphere ─────────────────────────────────────────────────────────
    const pulseGeom = new THREE.SphereGeometry(GLOBE_TUNING.routes.pulseRadius, 8, 8)
    const pulseMat = new THREE.MeshBasicMaterial({
      color: PALETTE.routePulse,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const pulse = new THREE.Mesh(pulseGeom, pulseMat)
    pulse.position.copy(points[0])

    result.push({
      tube,
      glowTube,
      pulse,
      pulseMat,
      curve,
      points,
      offset: idx * 1100,
    })
  })

  return result
}
