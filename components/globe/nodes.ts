import * as THREE from 'three'
import type { NodeDef, NodeTier } from './tuning'
import { NODE_STYLE, NODE_COLORS } from './tuning'
import { toSphere } from './utils'

export interface NodeVisual {
  id: string
  tier: NodeTier
  group: THREE.Group
  glow: THREE.Mesh
  core: THREE.Mesh
  highlight: THREE.Mesh
  pos: THREE.Vector3
  glowMat: THREE.MeshBasicMaterial
  hiMat: THREE.MeshBasicMaterial
}

export function createNodeVisual(
  node: NodeDef,
  radius: number,
): NodeVisual {
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
    opacity: 1,
    depthWrite: false,
  })

  const hiMat = new THREE.MeshBasicMaterial({
    color: NODE_COLORS.highlight,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  })

  const glow = new THREE.Mesh(new THREE.SphereGeometry(style.glow, 14, 14), glowMat)
  const core = new THREE.Mesh(new THREE.SphereGeometry(style.core, 16, 16), coreMat)
  const highlight = new THREE.Mesh(new THREE.SphereGeometry(style.hi, 12, 12), hiMat)

  glow.position.copy(pos)
  core.position.copy(pos)
  highlight.position.copy(pos)

  group.add(glow, core, highlight)

  return { id: node.id, tier: node.tier, group, glow, core, highlight, pos, glowMat, hiMat }
}

export function setNodeState(
  node: NodeVisual,
  state: 'idle' | 'send' | 'receive',
  t: number,
) {
  const base = NODE_STYLE[node.tier].baseGlow

  if (state === 'idle') {
    node.glowMat.opacity = base + Math.sin(t * 0.001 + node.id.length) * 0.008
    node.hiMat.opacity = node.tier === 'primary' ? 0.82 : 0.68
    return
  }

  if (state === 'send') {
    node.glowMat.opacity = base + 0.12
    node.hiMat.opacity = 0.95
    return
  }

  if (state === 'receive') {
    node.glowMat.opacity = base + 0.18
    node.hiMat.opacity = 1.0
  }
}

// Build all nodes
export function buildNodes(nodes: NodeDef[], R: number): NodeVisual[] {
  return nodes.map(node => createNodeVisual(node, R))
}
