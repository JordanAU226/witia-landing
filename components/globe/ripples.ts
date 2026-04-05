import * as THREE from 'three'

interface RippleRing {
  mesh: THREE.Mesh
  mat: THREE.MeshBasicMaterial
  startMs: number
  duration: number
  maxRadius: number
  startRadius: number
  peakOpacity: number
  pos: THREE.Vector3
  normal: THREE.Vector3
}

export class RippleSystem {
  private scene: THREE.Group
  private ripples: RippleRing[] = []
  private disposables: { dispose(): void }[] = []

  constructor(scene: THREE.Group) {
    this.scene = scene
  }

  // Spawn concentric rings at a sphere position (node arrival)
  spawnNodeRipple(pos: THREE.Vector3, nowMs: number, color = '#8eaddc') {
    const normal = pos.clone().normalize()
    const count = 2  // 2 staggered rings

    for (let i = 0; i < count; i++) {
      const delay = i * 200

      const ringGeo = new THREE.RingGeometry(0.001, 0.018, 48)  // thin ring
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
      const mesh = new THREE.Mesh(ringGeo, mat)

      // Position at node location
      mesh.position.copy(pos)

      // Orient ring to face outward (align with sphere normal)
      mesh.lookAt(pos.clone().multiplyScalar(2))

      this.scene.add(mesh)
      this.disposables.push(ringGeo, mat)

      this.ripples.push({
        mesh,
        mat,
        startMs: nowMs + delay,
        duration: 850,
        maxRadius: 0.22,
        startRadius: 0.015,
        peakOpacity: 0.18,
        pos: pos.clone(),
        normal,
      })
    }
  }

  // Update all ripples each frame
  update(nowMs: number) {
    for (const ripple of this.ripples) {
      const elapsed = nowMs - ripple.startMs
      if (elapsed < 0) {
        ripple.mat.opacity = 0
        continue
      }
      if (elapsed > ripple.duration) {
        ripple.mat.opacity = 0
        continue
      }

      const t = elapsed / ripple.duration
      // Expand radius via scale (base ring outer radius = 0.018)
      const currentRadius = ripple.startRadius + (ripple.maxRadius - ripple.startRadius) * t
      ripple.mesh.scale.setScalar(currentRadius / 0.018)

      // Sine envelope opacity
      ripple.mat.opacity = ripple.peakOpacity * Math.sin(t * Math.PI)
    }

    // Remove meshes and entries older than 5s
    const cutoff = nowMs - 5000
    this.ripples = this.ripples.filter(r => {
      if (r.startMs < cutoff) {
        this.scene.remove(r.mesh)
        return false
      }
      return true
    })
  }

  dispose() {
    this.disposables.forEach(d => d.dispose())
    this.ripples.forEach(r => this.scene.remove(r.mesh))
    this.ripples = []
  }
}
