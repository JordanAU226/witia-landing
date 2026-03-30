import * as THREE from 'three'
import { GLOBE_TUNING } from './tuning'
import type { NodeDef } from './tuning'
import { toSphere } from './utils'

export interface NodeObject {
  halo: THREE.Mesh
  core: THREE.Mesh
  highlight: THREE.Mesh
  haloMat: THREE.MeshBasicMaterial
}

export function buildNodes(nodes: NodeDef[], R: number): NodeObject[] {
  const result: NodeObject[] = []

  for (const node of nodes) {
    const isTier1 = node.tier === 1
    const haloR      = isTier1 ? 0.060 : 0.044
    const coreR      = isTier1 ? 0.030 : 0.022
    const highlightR = isTier1 ? 0.010 : 0.007

    const pos = toSphere(node.lat, node.lng, R + 0.04)

    // Halo
    const haloGeom = new THREE.SphereGeometry(haloR, 16, 16)
    const haloMat = new THREE.MeshBasicMaterial({
      color: '#6e98e3',
      transparent: true,
      opacity: 0.10,
      depthWrite: false,
    })
    const halo = new THREE.Mesh(haloGeom, haloMat)
    halo.position.copy(pos)

    // Core
    const coreGeom = new THREE.SphereGeometry(coreR, 16, 16)
    const coreMat = new THREE.MeshBasicMaterial({
      color: '#26497a',
      opacity: 1.0,
      depthWrite: true,
    })
    const core = new THREE.Mesh(coreGeom, coreMat)
    core.position.copy(pos)

    // Highlight (specular sparkle)
    const hlGeom = new THREE.SphereGeometry(highlightR, 8, 8)
    const hlMat = new THREE.MeshBasicMaterial({
      color: '#c8d8f0',
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
    const highlight = new THREE.Mesh(hlGeom, hlMat)
    // Offset highlight slightly toward viewer
    const offset = pos.clone().normalize().multiplyScalar(coreR * 0.6)
    highlight.position.copy(pos).add(offset)

    result.push({ halo, core, highlight, haloMat })
  }

  return result
}
