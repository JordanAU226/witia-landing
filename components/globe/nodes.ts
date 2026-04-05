import * as THREE from 'three'
import type { NodeDef, NodeTier } from './tuning'
import { NODE_STYLE, NODE_COLORS } from './tuning'
import { toSphere } from './utils'

type NodeState = 'idle' | 'send' | 'receive'

export interface NodeVisual {
  id: string
  tier: NodeTier
  group: THREE.Group
  glow: THREE.Mesh
  core: THREE.Mesh
  highlight: THREE.Mesh
  pos: THREE.Vector3

  glowMat: THREE.MeshBasicMaterial
  coreMat: THREE.MeshBasicMaterial
  hiMat: THREE.MeshBasicMaterial

  phaseOffset: number
  state: NodeState
  stateStrength: number

  targetGlowOpacity: number
  targetCoreOpacity: number
  targetHighlightOpacity: number

  targetGlowScale: number
  targetCoreScale: number
  targetHighlightScale: number

  edgeAttenuation: number
}

function hashPhase(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 33 + id.charCodeAt(i)) >>> 0
  }
  return ((h % 1000) / 1000) * Math.PI * 2
}

function getBaseHighlightOpacity(tier: NodeTier) {
  return tier === 'primary' ? 0.82 : tier === 'secondary' ? 0.72 : 0.62
}

function getBaseCoreOpacity(tier: NodeTier) {
  return tier === 'primary' ? 1.0 : tier === 'secondary' ? 0.96 : 0.92
}

export function createNodeVisual(node: NodeDef, radius: number): NodeVisual {
  const style = NODE_STYLE[node.tier]
  const pos = toSphere(node.lat, node.lng, radius + 0.04)

  const group = new THREE.Group()
  group.position.copy(pos)

  const glowMat = new THREE.MeshBasicMaterial({
    color: NODE_COLORS.glow,
    transparent: true,
    opacity: style.baseGlow,
    depthWrite: false,
  })

  const coreMat = new THREE.MeshBasicMaterial({
    color: NODE_COLORS.core,
    transparent: true,
    opacity: getBaseCoreOpacity(node.tier),
    depthWrite: false,
  })

  const hiMat = new THREE.MeshBasicMaterial({
    color: NODE_COLORS.highlight,
    transparent: true,
    opacity: getBaseHighlightOpacity(node.tier),
    depthWrite: false,
  })

  const glow      = new THREE.Mesh(new THREE.SphereGeometry(style.glow, 14, 14), glowMat)
  const core      = new THREE.Mesh(new THREE.SphereGeometry(style.core, 16, 16), coreMat)
  const highlight = new THREE.Mesh(new THREE.SphereGeometry(style.hi,   12, 12), hiMat)

  glow.renderOrder      = 30
  core.renderOrder      = 31
  highlight.renderOrder = 32

  group.add(glow, core, highlight)

  return {
    id: node.id,
    tier: node.tier,
    group,
    glow,
    core,
    highlight,
    pos,
    glowMat,
    coreMat,
    hiMat,
    phaseOffset: hashPhase(node.id),
    state: 'idle',
    stateStrength: 0,
    targetGlowOpacity:      style.baseGlow,
    targetCoreOpacity:      getBaseCoreOpacity(node.tier),
    targetHighlightOpacity: getBaseHighlightOpacity(node.tier),
    targetGlowScale:        1,
    targetCoreScale:        1,
    targetHighlightScale:   1,
    edgeAttenuation: 1,
  }
}

export function setNodeState(node: NodeVisual, state: NodeState, nowMs: number) {
  const style = NODE_STYLE[node.tier]
  const idleBreath = Math.sin(nowMs * 0.001 + node.phaseOffset) * 0.008

  node.state = state

  if (state === 'idle') {
    node.stateStrength          = 0
    node.targetGlowOpacity      = style.baseGlow + idleBreath
    node.targetCoreOpacity      = getBaseCoreOpacity(node.tier)
    node.targetHighlightOpacity = getBaseHighlightOpacity(node.tier)
    node.targetGlowScale        = 1
    node.targetCoreScale        = 1
    node.targetHighlightScale   = 1
    return
  }

  if (state === 'send') {
    node.stateStrength          = 0.72
    node.targetGlowOpacity      = style.baseGlow + 0.12
    node.targetCoreOpacity      = 1.0
    node.targetHighlightOpacity = 0.95
    node.targetGlowScale        = 1.16
    node.targetCoreScale        = 1.05
    node.targetHighlightScale   = 1.12
    return
  }

  if (state === 'receive') {
    node.stateStrength          = 1.0
    node.targetGlowOpacity      = style.baseGlow + 0.18
    node.targetCoreOpacity      = 1.0
    node.targetHighlightOpacity = 1.0
    node.targetGlowScale        = 1.24
    node.targetCoreScale        = 1.08
    node.targetHighlightScale   = 1.18
  }
}

export function setNodeEdgeAttenuation(node: NodeVisual, amount: number) {
  node.edgeAttenuation = THREE.MathUtils.clamp(amount, 0, 1)
}

export function updateNodeVisual(node: NodeVisual, nowMs: number) {
  const style = NODE_STYLE[node.tier]

  const idleMicroBreath =
    node.state === 'idle'
      ? 1 + Math.sin(nowMs * 0.00125 + node.phaseOffset) * 0.012
      : 1

  const tierGlowCap =
    node.tier === 'primary'
      ? style.baseGlow + 0.20
      : node.tier === 'secondary'
      ? style.baseGlow + 0.16
      : style.baseGlow + 0.12

  const att = node.edgeAttenuation

  const attGlow = Math.min(node.targetGlowOpacity, tierGlowCap) * att
  const attCore = THREE.MathUtils.lerp(
    getBaseCoreOpacity(node.tier) * 0.82,
    node.targetCoreOpacity,
    att,
  )
  const attHi = THREE.MathUtils.lerp(
    getBaseHighlightOpacity(node.tier) * 0.65,
    node.targetHighlightOpacity,
    att,
  )

  node.glowMat.opacity += (attGlow - node.glowMat.opacity) * 0.14
  node.coreMat.opacity += (attCore - node.coreMat.opacity) * 0.16
  node.hiMat.opacity   += (attHi   - node.hiMat.opacity)   * 0.18

  const glowTarget = node.targetGlowScale * idleMicroBreath
  node.glow.scale.setScalar(      node.glow.scale.x      + (glowTarget               - node.glow.scale.x)      * 0.14)
  node.core.scale.setScalar(      node.core.scale.x      + (node.targetCoreScale     - node.core.scale.x)      * 0.16)
  node.highlight.scale.setScalar( node.highlight.scale.x + (node.targetHighlightScale - node.highlight.scale.x) * 0.18)

  // Tiny beacon lift
  const lift =
    node.state === 'idle'
      ? Math.sin(nowMs * 0.0011 + node.phaseOffset) * 0.002
      : node.state === 'send'
      ? 0.004
      : 0.006

  const dir = node.pos.clone().normalize()
  node.group.position.copy(node.pos.clone().add(dir.multiplyScalar(lift)))
}

export function buildNodes(nodes: NodeDef[], radius: number): NodeVisual[] {
  return nodes.map((node) => createNodeVisual(node, radius))
}
