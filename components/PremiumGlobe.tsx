'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLOBE_TUNING, PALETTE, NODES, ROUTES } from './globe/tuning'
import { toSphere } from './globe/utils'
import { buildLandMeshes, buildCoastlines, buildBorders, buildGraticule } from './globe/geo'
import { buildInnerAtmosphere, buildOuterHalo } from './globe/atmosphere'
import { buildRoutes, type RouteObject } from './globe/routes'
import { buildNodes, type NodeObject } from './globe/nodes'
import { buildLighting } from './globe/lighting'
import { createInteractionController } from './globe/interaction'

interface PremiumGlobeProps {
  size?: number
  quality?: 'auto' | 'high' | 'medium'
  interactive?: boolean
  className?: string
}

export default function PremiumGlobe({
  size = 520,
  quality = 'auto',
  interactive = true,
  className,
}: PremiumGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Dispose registry ────────────────────────────────────────────────────
    const disposables: { dispose(): void }[] = []

    // ── Renderer ─────────────────────────────────────────────────────────────
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // ── Scene & camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      34,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    )
    camera.position.z = 8.5

    // ── Globe group ──────────────────────────────────────────────────────────
    const group = new THREE.Group()
    // Authored hero pose: Europe/Africa/Atlantic corridor prominent
    // Shows London, Lagos, Brussels as primary focal cluster
    // Authored hero pose: Africa/Europe/Middle East — canonical load state
    // ~20°E, 10°N — Europe upper-left, West Africa center-left, Middle East right
    group.rotation.x = GLOBE_TUNING.motion.defaultRotX
    group.rotation.y = GLOBE_TUNING.motion.defaultRotY
    scene.add(group)

    // ── Lighting (scene-level, not rotating) ─────────────────────────────────
    const lights = buildLighting()
    lights.forEach(l => scene.add(l))

    // ── Base sphere ──────────────────────────────────────────────────────────
    const sphereGeom = new THREE.SphereGeometry(GLOBE_TUNING.radius, 64, 64)
    disposables.push(sphereGeom)
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: PALETTE.oceanBase,
      roughness: 0.92,
      metalness: 0.0,
      clearcoat: 0.04,
      clearcoatRoughness: 0.94,
    })
    disposables.push(sphereMat)
    const sphere = new THREE.Mesh(sphereGeom, sphereMat)
    group.add(sphere)

    // ── Atmosphere shells (scene-level so they don't rotate with globe) ──────
    // Actually keep on group so they render relative to globe center
    const innerAtmo = buildInnerAtmosphere(GLOBE_TUNING)
    const outerHalo = buildOuterHalo(GLOBE_TUNING)
    disposables.push(innerAtmo.geometry, innerAtmo.material as THREE.Material)
    disposables.push(outerHalo.geometry, outerHalo.material as THREE.Material)
    scene.add(innerAtmo)
    scene.add(outerHalo)

    // ── Route & node state ───────────────────────────────────────────────────
    let routes: RouteObject[] = []
    let nodeObjects: NodeObject[] = []
    let interactionCtrl: ReturnType<typeof createInteractionController> | null = null

    // ── Geo data (async) ─────────────────────────────────────────────────────
    const abortCtrl = new AbortController()

    fetch('/world-110m.json', { signal: abortCtrl.signal })
      .then(r => r.json())
      .then(world => {
        // Land meshes
        const landMeshes = buildLandMeshes(world, GLOBE_TUNING.radius)
        landMeshes.forEach(m => {
          disposables.push(m.geometry)
          group.add(m)
        })
        // Share material (all land meshes use same material)
        if (landMeshes.length > 0) disposables.push(landMeshes[0].material as THREE.Material)

        // Coastlines
        const coastlines = buildCoastlines(world, GLOBE_TUNING.radius)
        disposables.push(coastlines.geometry, coastlines.material as THREE.Material)
        group.add(coastlines)

        // Borders
        const borders = buildBorders(world, GLOBE_TUNING.radius)
        disposables.push(borders.geometry, borders.material as THREE.Material)
        group.add(borders)

        // Graticule
        const graticule = buildGraticule(GLOBE_TUNING.radius)
        disposables.push(graticule.geometry, graticule.material as THREE.Material)
        group.add(graticule)

        // ── Network overlay ─────────────────────────────────────────────────
        const nodeMap: Record<string, { lat: number; lng: number }> = {}
        NODES.forEach(n => { nodeMap[n.id] = { lat: n.lat, lng: n.lng } })

        // Routes
        routes = buildRoutes(nodeMap, ROUTES)
        routes.forEach(r => {
          disposables.push(r.tube.geometry, r.tube.material as THREE.Material)
          disposables.push(r.glowTube.geometry, r.glowTube.material as THREE.Material)
          disposables.push(r.pulse.geometry, r.pulseMat)
          group.add(r.tube)
          group.add(r.glowTube)
          group.add(r.pulse)
        })

        // Nodes
        nodeObjects = buildNodes(NODES, GLOBE_TUNING.radius)
        nodeObjects.forEach(n => {
          disposables.push(n.halo.geometry, n.haloMat)
          disposables.push(n.core.geometry, n.core.material as THREE.Material)
          group.add(n.halo)
          group.add(n.core)
          if (n.highlight) {
            disposables.push(n.highlight.geometry, n.highlight.material as THREE.Material)
            group.add(n.highlight)
          }
        })

        // ── Interaction ─────────────────────────────────────────────────────
        if (interactive) {
          interactionCtrl = createInteractionController(group, renderer.domElement)
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('Globe geo fetch failed:', err)
      })

    // ── Animation loop ───────────────────────────────────────────────────────
    let rafId: number

    function animate() {
      rafId = requestAnimationFrame(animate)

      // Interaction update
      if (interactionCtrl) {
        interactionCtrl.update()
      } else if (interactive === false) {
        // No interaction — just drift
        group.rotation.y += 0.00040
      } else {
        // Waiting for data — slow drift
        group.rotation.y += 0.00040
      }

      const now = Date.now()

      // ── Constrained curated drift ───────────────────────────────────────────
      // Long 62s cycle, asymmetric: ~65% dwell on Africa/Europe best face
      // Uses a biased sine so it spends more time near zero (default pose)
      const { defaultRotY, defaultRotX, sweepAmplitude, sweepPeriod } = GLOBE_TUNING.motion
      const sweepT = (now % sweepPeriod) / sweepPeriod
      // Biased sweep: cube the sine to create longer dwell at zero crossing
      const rawSin = Math.sin(sweepT * Math.PI * 2)
      const biasedSweep = Math.sign(rawSin) * Math.pow(Math.abs(rawSin), 2.2)
      const sweepAngle = sweepAmplitude * biasedSweep * 0.65
      // Pitch: 1-2° max, very slow
      const pitchBreath = (1.2 * Math.PI / 180) * Math.sin(now * 0.000065)

      if (interactionCtrl) {
        interactionCtrl.update()
      } else {
        group.rotation.y += (defaultRotY + sweepAngle - group.rotation.y) * 0.0008
        group.rotation.x += (defaultRotX + pitchBreath - group.rotation.x) * 0.0008
      }

      // ── Route animation: 1 hero arc + 1 supporting arc max ──────────────────
      // Routes[0] = transatlantic (hero), Routes[1] = London-Lagos (supporting)
      // Remaining routes shown only as static lines at low opacity
      routes.forEach((route, idx) => {
        const isHero = idx === 0      // transatlantic — the ONE route that carries meaning
        const isSupport = idx === 1   // London-Lagos — quieter second arc

        // Hero arc: raised ~10% for spatial identity vs sphere body
        // Support arc: lower, never competes with hero
        // Others: invisible pulse, very low line
        const cycleMs = isHero ? 5800 : 6800 + idx * 500
        const t = ((now + route.offset) % cycleMs) / cycleMs

        const maxOpacity = isHero ? 0.26 : isSupport ? 0.12 : 0.05
        const lineAlpha = t < 0.08 ? t / 0.08 : t > 0.88 ? (1 - t) / 0.12 : 1
        ;(route.tube.material as THREE.MeshBasicMaterial).opacity = lineAlpha * maxOpacity
        // Glow: hero gets a restrained glow for spatial separation, support minimal
        ;(route.glowTube.material as THREE.MeshBasicMaterial).opacity = lineAlpha * (isHero ? 0.07 : 0.02)

        // SINGLE pulse: only the hero arc has a strong pulse
        // Support arc gets a very quiet one — never reads as a second bright accent
        if (isHero || isSupport) {
          const pulseT = Math.pow(t, 0.92) // smooth ease
          const ptIdx = Math.min(Math.floor(pulseT * route.points.length), route.points.length - 1)
          route.pulse.position.copy(route.points[ptIdx])

          const basePulse = isHero ? 0.92 : 0.28 // support pulse barely visible
          route.pulseMat.opacity = lineAlpha * basePulse

          // Arrival bloom — brief, one moment only
          const nearEnd = Math.max(0, 1 - Math.abs(t - 0.82) / 0.18)
          if (nearEnd > 0) {
            route.pulseMat.opacity = Math.min(0.97, route.pulseMat.opacity + nearEnd * 0.30)
            // Destination node responds to arrival — London node (idx 0 in NODES)
            if (nearEnd > 0.6 && isHero) {
              const londonNode = nodeObjects.find(n => n.tier === 1)
              if (londonNode) {
                londonNode.haloMat.opacity = Math.min(0.20, londonNode.haloMat.opacity + nearEnd * 0.07)
              }
            }
          }
        } else {
          route.pulseMat.opacity = 0
        }
      })

      // ── Node halos: subtle breathing + limb suppression ────────────────────
      nodeObjects.forEach((node, idx) => {
        const phase = (now * 0.00052 + idx * 1.1) % (Math.PI * 2)
        const base = node.tier === 1 ? 0.09 : node.tier === 2 ? 0.06 : 0.04
        const amp  = node.tier === 1 ? 0.016 : node.tier === 2 ? 0.010 : 0.007
        let opacity = base + Math.sin(phase) * amp

        // Limb suppression: project node pos through camera to detect edge proximity
        // If node is near the sphere silhouette, reduce halo to keep edge composed
        const nodeInView = node.pos.clone().applyQuaternion(group.quaternion)
        const edgeDot = nodeInView.clone().normalize().dot(new THREE.Vector3(0, 0, 1))
        // edgeDot near 0 = at limb, near 1 = facing camera
        if (edgeDot < 0.18) {
          const limbFade = Math.max(0, edgeDot / 0.18)
          opacity *= limbFade * 0.5
        }

        node.haloMat.opacity = Math.max(0, opacity)
      })

      renderer.render(scene, camera)
    }

    animate()

    // ── Responsive resize ────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver(() => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    resizeObserver.observe(mount)

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      abortCtrl.abort()
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      if (interactionCtrl) interactionCtrl.dispose()
      disposables.forEach(d => d.dispose())
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [interactive])

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        width:  size,
        height: size,
        maxWidth: '100%',
        aspectRatio: '1 / 1',
      }}
    />
  )
}
