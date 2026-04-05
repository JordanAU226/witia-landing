import * as THREE from 'three'
import type { NodeDef, NodeTier } from './tuning'
import { NODE_STYLE, NODE_COLORS } from './tuning'
import { toSphere } from './utils'

export type NodeState = 'idle' | 'send' | 'receive'

export interface NodeVisual {
  id: string
  tier: NodeTier
  group: THREE.Group
  glow: THREE.Mesh
  core: THREE.Mesh
  highlight: THREE.Mesh
  pos: THREE.Vector3
  // Materials
  glowMat: THREE.MeshBasicMaterial
  coreMat: THREE.MeshBasicMaterial
  hiMat: THREE.MeshBasicMaterial
  // Animated state
  state: NodeState
  phaseOffset: number
  edgeAttenuation: number
  // Target values (lerped toward each frame)
  targetGlowOpacity: number
  targetCoreOpacity: number
  targetHighlightOpacity: number
  targetGlowScale: number
  targetCoreScale: number
  targetHighlightScale: number
}

function getBaseCoreOpacity(tier: NodeTier): number {
  return tier === 'primary' ? 1.0 : tier === 'secondary' ? 0.92 : tier === 'tertiary' ? 0.84 : 0.72
}

function getBaseHighlightOpacity(tier: NodeTier): number {
  return tier === 'primary' ? 0.82 : tier === 'secondary' ? 0.72 : tier === 'tertiary' ? 0.60 : 0.45
}

export function createNodeVisual(node: NodeDef, radius: number): NodeVisual {
  const style = NODE_STYLE[node.tier]
  const pos = toSphere(node.lat, node.lng, radius + 0.04)
  const group = new THREE.Group()

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

  glow.position.copy(pos)
  core.position.copy(pos)
  highlight.position.copy(pos)

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
    state: 'idle',
    phaseOffset: Math.random() * Math.PI * 2,
    edgeAttenuation: 1,
    targetGlowOpacity: style.baseGlow,
    targetCoreOpacity: getBaseCoreOpacity(node.tier),
    targetHighlightOpacity: getBaseHighlightOpacity(node.tier),
    targetGlowScale: 1,
    targetCoreScale: 1,
    targetHighlightScale: 1,
  }
}

// Set desired state — sets target values, updateNodeVisual lerps toward them
export function setNodeState(node: NodeVisual, state: NodeState, _nowMs: number) {
  const style = NODE_STYLE[node.tier]
  node.state = state

  if (state === 'idle') {
    node.targetGlowOpacity      = style.baseGlow
    node.targetCoreOpacity      = getBaseCoreOpacity(node.tier)
    node.targetHighlightOpacity = getBaseHighlightOpacity(node.tier)
    node.targetGlowScale        = 1.0
    node.targetCoreScale        = 1.0
    node.targetHighlightScale   = 1.0
    return
  }

  if (state === 'send') {
    node.targetGlowOpacity      = style.baseGlow + 0.12
    node.targetCoreOpacity      = getBaseCoreOpacity(node.tier)
    node.targetHighlightOpacity = 0.95
    node.targetGlowScale        = 1.12
    node.targetCoreScale        = 1.0
    node.targetHighlightScale   = 1.0
    return
  }

  if (state === 'receive') {
    node.targetGlowOpacity      = style.baseGlow + 0.18
    node.targetCoreOpacity      = 1.0
    node.targetHighlightOpacity = 1.0
    node.targetGlowScale        = 1.22
    node.targetCoreScale        = 1.04
    node.targetHighlightScale   = 1.0
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

  const attenuatedGlowTarget =
    Math.min(node.targetGlowOpacity, tierGlowCap) * att
  const attenuatedCoreTarget =
    THREE.MathUtils.lerp(
      getBaseCoreOpacity(node.tier) * 0.82,
      node.targetCoreOpacity,
      att,
    )
  const attenuatedHiTarget =
    THREE.MathUtils.lerp(
      getBaseHighlightOpacity(node.tier) * 0.65,
      node.targetHighlightOpacity,
      att,
    )

  // Lerp all opacities
  node.glowMat.opacity += (attenuatedGlowTarget - node.glowMat.opacity) * 0.14
  node.coreMat.opacity += (attenuatedCoreTarget  - node.coreMat.opacity) * 0.16
  node.hiMat.opacity   += (attenuatedHiTarget    - node.hiMat.opacity)   * 0.18

  // Lerp scales
  const glowScaleTarget = node.targetGlowScale * idleMicroBreath
  const nextGlow  = node.glow.scale.x      + (glowScaleTarget          - node.glow.scale.x)      * 0.14
  const nextCore  = node.core.scale.x      + (node.targetCoreScale     - node.core.scale.x)      * 0.16
  const nextHi    = node.highlight.scale.x + (node.targetHighlightScale - node.highlight.scale.x) * 0.18

  node.glow.scale.setScalar(nextGlow)
  node.core.scale.setScalar(nextCore)
  node.highlight.scale.setScalar(nextHi)

  // Tiny beacon lift — makes nodes feel alive
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
