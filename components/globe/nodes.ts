import * as THREE from 'three'
import { GLOBE_TUNING, PALETTE } from './tuning'
import type { NodeDef } from './tuning'
import { toSphere } from './utils'

export interface NodeObject {
  halo: THREE.Mesh
  core: THREE.Mesh
  highlight: THREE.Mesh | null
  haloMat: THREE.MeshBasicMaterial
  tier: 1 | 2 | 3
  pos: THREE.Vector3
}

// Node sizes — three-tier hub system
// At hero scale: tier1 core ~7-8px, tier2 ~5-6px, tier3 ~4-5px
const TIER_CONFIG = {
  1: { haloR: 0.068, coreR: 0.034, hlR: 0.010 },
  2: { haloR: 0.048, coreR: 0.024, hlR: 0.006 },
  3: { haloR: 0.036, coreR: 0.018, hlR: 0 },
}

export function buildNodes(nodes: NodeDef[], R: number): NodeObject[] {
  const result: NodeObject[] = []

  for (const node of nodes) {
    const cfg = TIER_CONFIG[node.tier]
    const pos = toSphere(node.lat, node.lng, R + 0.038)

    // Halo — large but very soft, max 8-12% alpha
    const haloGeom = new THREE.SphereGeometry(cfg.haloR, 16, 16)
    const haloMat = new THREE.MeshBasicMaterial({
      color: PALETTE.nodeCore,
      transparent: true,
      opacity: node.tier === 1 ? 0.10 : node.tier === 2 ? 0.07 : 0.05,
      depthWrite: false,
    })
    const halo = new THREE.Mesh(haloGeom, haloMat)
    halo.position.copy(pos)

    // Core — dark, compact, precise
    const coreGeom = new THREE.SphereGeometry(cfg.coreR, 16, 16)
    const coreMat = new THREE.MeshBasicMaterial({
      color: PALETTE.nodeCore,
      depthWrite: true,
    })
    const core = new THREE.Mesh(coreGeom, coreMat)
    core.position.copy(pos)

    // Highlight — tiny bright center, tier 1 only (clear), tier 2 subtle
    let highlight: THREE.Mesh | null = null
    if (cfg.hlR > 0) {
      const hlGeom = new THREE.SphereGeometry(cfg.hlR, 8, 8)
      const hlMat = new THREE.MeshBasicMaterial({
        color: PALETTE.nodeHighlight,
        transparent: true,
        opacity: node.tier === 1 ? 0.82 : 0.45,
        depthWrite: false,
      })
      highlight = new THREE.Mesh(hlGeom, hlMat)
      // Offset highlight toward viewer for micro-specular feel
      const offset = pos.clone().normalize().multiplyScalar(cfg.coreR * 0.55)
      highlight.position.copy(pos).add(offset)
    }

    result.push({ halo, core, highlight, haloMat, tier: node.tier, pos })
  }

  return result
}
