'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLOBE_TUNING, PALETTE, NODES, ROUTES } from './globe/tuning'
import { toSphere } from './globe/utils'
import { buildLandMeshes, buildCoastlines, buildBorders, buildGraticule } from './globe/geo'
import { buildInnerAtmosphere, buildOuterHalo } from './globe/atmosphere'
import { buildRoutes, type RouteObject } from './globe/routes'
import { buildNodes, setNodeState, type NodeVisual } from './globe/nodes'
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

    // ── Detect environment ──────────────────────────────────────────────────
    const isMobile = window.innerWidth <= 600
    const isTablet = window.innerWidth > 600 && window.innerWidth <= 1024
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Progressive fidelity: desktop full, tablet reduced, mobile minimal
    const renderSize = isMobile ? 280 : isTablet ? 380 : size
    // Sphere segments by device tier
    const sphereSegments = isMobile ? 32 : isTablet ? 48 : 64
    // Max routes to animate by device tier
    const maxRoutes = isMobile ? 3 : isTablet ? 5 : Infinity

    // ── Dispose registry ────────────────────────────────────────────────────
    const disposables: { dispose(): void }[] = []

    // ── Renderer ─────────────────────────────────────────────────────────────
    // Mobile: cap pixel ratio at 1.5 for performance
    const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(pixelRatio)
    const isSmallDevice = isMobile || isTablet
    renderer.setSize(isSmallDevice ? renderSize : mount.clientWidth, isSmallDevice ? renderSize : mount.clientHeight)
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
    // Hero pose: canonical load state
    group.rotation.x = GLOBE_TUNING.motion.defaultRotX  // -0.165
    group.rotation.y = GLOBE_TUNING.motion.defaultRotY  // 0.345
    scene.add(group)

    // ── Lighting (scene-level, not rotating) ─────────────────────────────────
    const lights = buildLighting()
    lights.forEach(l => scene.add(l))

    // ── Base sphere ──────────────────────────────────────────────────────────
    const sphereGeom = new THREE.SphereGeometry(GLOBE_TUNING.radius, sphereSegments, sphereSegments)
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
    let nodeVisuals: NodeVisual[] = []
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

        // Nodes — using new NodeVisual system
        nodeVisuals = buildNodes(NODES, GLOBE_TUNING.radius)
        nodeVisuals.forEach(n => {
          disposables.push(n.glow.geometry, n.glowMat)
          disposables.push(n.core.geometry, n.core.material as THREE.Material)
          disposables.push(n.highlight.geometry, n.hiMat)
          group.add(n.group)
        })

        // ── Interaction ─────────────────────────────────────────────────────
        // Mobile: light touch drag only, no scroll conflict
        // Reduced motion: no interaction at all — pure poster state
        if (interactive && !prefersReducedMotion) {
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

      if (prefersReducedMotion) {
        // Static poster state — perfectly composed, no motion
        group.rotation.y = defaultRotY
        group.rotation.x = defaultRotX
      } else if (interactionCtrl) {
        interactionCtrl.update()
      } else {
        group.rotation.y += (defaultRotY + sweepAngle - group.rotation.y) * 0.0008
        group.rotation.x += (defaultRotX + pitchBreath - group.rotation.x) * 0.0008
      }

      // ── Animate nodes using setNodeState ────────────────────────────────────
      nodeVisuals.forEach(node => {
        setNodeState(node, 'idle', now)
      })

      // ── Route animation: progressive fidelity by device tier ────────────────
      // Routes[0] = transatlantic (hero), Routes[1] = London-Lagos (supporting)
      // Remaining routes shown only as static lines at low opacity
      // maxRoutes caps the number of animated routes (mobile=3, tablet=5, desktop=all)
      routes.forEach((route, idx) => {
        const isHero = idx === 0      // transatlantic — the ONE route that carries meaning
        const isSupport = idx === 1   // London-Lagos — quieter second arc

        // Beyond device tier limit: hide entirely
        if (idx >= maxRoutes) {
          ;(route.tube.material as THREE.MeshBasicMaterial).opacity = 0
          ;(route.glowTube.material as THREE.MeshBasicMaterial).opacity = 0
          route.pulseMat.opacity = 0
          return
        }

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

            // During route pulse arrivals — trigger send/receive states
            if (nearEnd > 0.6 && isHero) {
              // Find london node and set to receive
              const londonNode = nodeVisuals.find(n => n.id === 'london')
              if (londonNode) setNodeState(londonNode, 'receive', now)
              // Near departure: lagos sends
              const lagosNode = nodeVisuals.find(n => n.id === 'lagos')
              if (lagosNode && t < 0.2) setNodeState(lagosNode, 'send', now)
            }
          }
        } else {
          route.pulseMat.opacity = 0
        }
      })

      renderer.render(scene, camera)
    }

    animate()

    // ── Responsive resize ────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver(() => {
      if (!mount) return
      const isMobileNow = window.innerWidth <= 600
      const isTabletNow = window.innerWidth > 600 && window.innerWidth <= 1024
      const w = isMobileNow ? 280 : isTabletNow ? 380 : mount.clientWidth
      const h = w // square aspect
      camera.aspect = 1
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
        width: '100%',
        maxWidth: `${size}px`,
        aspectRatio: '1 / 1',
      }}
    />
  )
}
