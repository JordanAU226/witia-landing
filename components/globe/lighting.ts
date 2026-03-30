import * as THREE from 'three'

export function buildLighting(): THREE.Object3D[] {
  const ambient = new THREE.AmbientLight(0xffffff, 0.28)

  const key = new THREE.DirectionalLight(0xfff4e8, 0.72) // warm
  key.position.set(4, 3, 5)

  const fill = new THREE.DirectionalLight(0xe8f0ff, 0.22) // cool
  fill.position.set(-3, -1, -3)

  const rim = new THREE.DirectionalLight(0xf0f4ff, 0.18)
  rim.position.set(-2, 4, -4)

  return [ambient, key, fill, rim]
}
