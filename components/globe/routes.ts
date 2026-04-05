import * as THREE from 'three'
import { GLOBE_TUNING, PALETTE } from './tuning'
import { toSphere, greatCircleDistance, arcLift } from './utils'

export interface NodeMap {
  [id: string]: { lat: number; lng: number }
}

export type RouteStrength = 'hero' | 'support'

export type RouteInput =
  | { id: string; from: string; to: string; strength?: RouteStrength }
  | readonly [string, string]

export interface ArcWaveRing {
  mesh: THREE.Mesh
  mat: THREE.MeshBasicMaterial
  offsetT: number
  baseOpacity: number
}

export interface RouteObject {
  id: string
  from: string
  to: string
  strength: RouteStrength

  tube: THREE.Mesh
  glowTube: THREE.Mesh
  haloLine: THREE.Line

  pulse: THREE.Mesh
  pulseMat: THREE.MeshBasicMaterial
  waveRings: ArcWaveRing[]

  points: THREE.Vector3[]
  tangents: THREE.Vector3[]
  offset: number
}

const WAVE_OFFSETS = [0, -0.035, -0.075]
const WAVE_OPACITIES = [1.0, 0.52, 0.24]

function normalizeRouteInput(input: RouteInput): {
  id: string
  from: string
  to: string
  strength: RouteStrength
} {
  if (Array.isArray(input)) {
    return {
      id: `${input[0]}-${input[1]}`,
      from: input[0] as string,
      to: input[1] as string,
      strength: 'support',
    }
  }

  const obj = input as { id: string; from: string; to: string; strength?: RouteStrength }
  return {
    id: obj.id,
    from: obj.from,
    to: obj.to,
    strength: obj.strength ?? 'support',
  }
}

function getSampleCount(distance: number, strength: RouteStrength) {
  const base =
    distance < 0.35 ? 56 :
    distance < 0.75 ? 72 :
    96

  return strength === 'hero' ? base + 12 : base
}

function slerpUnit(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const v0 = a.clone().normalize()
  const v1 = b.clone().normalize()

  const dot = THREE.MathUtils.clamp(v0.dot(v1), -0.999999, 0.999999)
  const omega = Math.acos(dot)
  const sinOmega = Math.sin(omega)

  if (sinOmega < 1e-5) {
    return v0.lerp(v1, t).normalize()
  }

  const s0 = Math.sin((1 - t) * omega) / sinOmega
  const s1 = Math.sin(t * omega) / sinOmega

  return v0.multiplyScalar(s0).add(v1.multiplyScalar(s1)).normalize()
}

class GreatCircleArcCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly startDir: THREE.Vector3,
    private readonly endDir: THREE.Vector3,
    private readonly baseRadius: number,
    private readonly lift: number,
    private readonly layerOffset: number,
  ) {
    super()
  }

  override getPoint(t: number, target = new THREE.Vector3()) {
    const dir = slerpUnit(this.startDir, this.endDir, t)
    const arch = Math.pow(Math.sin(Math.PI * t), 1.35)
    const radius = this.baseRadius + this.layerOffset + this.lift * arch
    return target.copy(dir).multiplyScalar(radius)
  }
}

function sampleCurve(curve: THREE.Curve<THREE.Vector3>, samples: number) {
  const points: THREE.Vector3[] = []
  const tangents: THREE.Vector3[] = []

  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    points.push(curve.getPoint(t))
    tangents.push(curve.getTangent(t).normalize())
  }

  return { points, tangents }
}

function makeTube(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number,
  radius: number,
  color: THREE.ColorRepresentation,
  blending: THREE.Blending,
): THREE.Mesh {
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, 6, false)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  return mesh
}

function makeHaloLine(points: THREE.Vector3[], color: THREE.ColorRepresentation): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const line = new THREE.Line(geometry, material)
  line.frustumCulled = false
  return line
}

function makeWaveRing(
  radius: number,
  color: THREE.ColorRepresentation,
): { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial } {
  const inner = Math.max(0.0008, radius * 0.24)
  const outer = radius

  const geometry = new THREE.RingGeometry(inner, outer, 32)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false

  return { mesh, material }
}

export function buildRoutes(nodes: NodeMap, routes: RouteInput[]): RouteObject[] {
  const result: RouteObject[] = []
  const globeRadius = GLOBE_TUNING.radius

  const routeBodyColor = new THREE.Color(PALETTE.routeBody)
  const routeGlowColor = routeBodyColor.clone().lerp(new THREE.Color('#ffffff'), 0.18)
  const routeHaloColor = routeBodyColor.clone().lerp(new THREE.Color('#ffffff'), 0.36)
  const pulseColor = new THREE.Color(PALETTE.routePulse)

  routes.forEach((input, idx) => {
    const { id, from, to, strength } = normalizeRouteInput(input)

    const fromNode = nodes[from]
    const toNode = nodes[to]
    if (!fromNode || !toNode) return

    const startDir = toSphere(fromNode.lat, fromNode.lng, 1).normalize()
    const endDir   = toSphere(toNode.lat,   toNode.lng,   1).normalize()

    const distance = greatCircleDistance(
      fromNode.lat,
      fromNode.lng,
      toNode.lat,
      toNode.lng,
    )

    const lift    = arcLift(distance, GLOBE_TUNING)
    const samples = getSampleCount(distance, strength)

    const coreCurve = new GreatCircleArcCurve(startDir, endDir, globeRadius, lift, 0.060)
    const glowCurve = new GreatCircleArcCurve(startDir, endDir, globeRadius, lift, 0.078)
    const haloCurve = new GreatCircleArcCurve(startDir, endDir, globeRadius, lift, 0.096)

    const { points, tangents } = sampleCurve(coreCurve, samples)
    const { points: haloPoints } = sampleCurve(haloCurve, samples)

    const tubeRadius  = GLOBE_TUNING.routes.tubeRadius  * (strength === 'hero' ? 1.08 : 0.92)
    const glowRadius  = tubeRadius * 1.9
    const pulseRadius = GLOBE_TUNING.routes.pulseRadius * (strength === 'hero' ? 1.05 : 0.95)

    const tube = makeTube(coreCurve, Math.max(32, samples), tubeRadius, routeBodyColor, THREE.NormalBlending)
    tube.renderOrder = 24

    const glowTube = makeTube(glowCurve, Math.max(32, samples), glowRadius, routeGlowColor, THREE.AdditiveBlending)
    glowTube.renderOrder = 23

    const haloLine = makeHaloLine(haloPoints, routeHaloColor)
    haloLine.renderOrder = 22

    const pulseGeom = new THREE.SphereGeometry(pulseRadius, 12, 12)
    const pulseMat  = new THREE.MeshBasicMaterial({
      color: pulseColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const pulse = new THREE.Mesh(pulseGeom, pulseMat)
    pulse.position.copy(points[0])
    pulse.renderOrder = 26
    pulse.frustumCulled = false

    const waveRings: ArcWaveRing[] = WAVE_OFFSETS.map((offsetT, i) => {
      const ringRadius =
        pulseRadius * (strength === 'hero' ? 1.18 + i * 0.1 : 1.1 + i * 0.08)

      const { mesh, material } = makeWaveRing(ringRadius, pulseColor)
      mesh.position.copy(points[0])
      mesh.renderOrder = 25

      return {
        mesh,
        mat: material,
        offsetT,
        baseOpacity: WAVE_OPACITIES[i] * (strength === 'hero' ? 1 : 0.82),
      }
    })

    result.push({
      id,
      from,
      to,
      strength,
      tube,
      glowTube,
      haloLine,
      pulse,
      pulseMat,
      waveRings,
      points,
      tangents,
      offset: idx * 1100,
    })
  })

  return result
}
