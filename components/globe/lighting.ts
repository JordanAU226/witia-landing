import * as THREE from 'three'

export function buildLighting(): THREE.Object3D[] {
  // Low ambient — let the key/fill create tonal richness
  const ambient = new THREE.AmbientLight(0xfff8f0, 0.20)

  // Key: warm, upper-front-right — defines the sphere and land relief
  const key = new THREE.DirectionalLight(0xfff6e8, 0.78)
  key.position.set(5, 4, 6)

  // Fill: cool, opposite — roughly 28% of key intensity
  const fill = new THREE.DirectionalLight(0xe4ecff, 0.20)
  fill.position.set(-4, -2, -3)

  // Rim: high rear — helps silhouette and atmosphere edge
  const rim = new THREE.DirectionalLight(0xdde8ff, 0.16)
  rim.position.set(-1, 5, -5)

  // Subtle cool accent supporting route color without turning globe blue
  const accent = new THREE.DirectionalLight(0xc8d8ff, 0.06)
  accent.position.set(2, 0, 4)

  return [ambient, key, fill, rim, accent]
}
