'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLOBE_TUNING, PALETTE, NODES, ROUTES, HERO_SEQUENCE, ROUTE_STYLE, HERO_MOTION, NODE_STYLE } from './globe/tuning'
import { buildLandMeshes, buildCoastlines, buildBorders, buildGraticule } from './globe/geo'
import { buildInnerAtmosphere, buildOuterHalo } from './globe/atmosphere'
import { buildRoutes, type RouteObject } from './globe/routes'
import { buildNodes, setNodeState, type NodeVisual } from './globe/nodes'
import { buildLighting } from './globe/lighting'
import { createInteractionController } from './globe/interaction'
import { RippleSystem } from './globe/ripples'

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

    // ── Dispose registry ────────────────────────────────────────────────────
    const disposables: { dispose(): void }[] = []

    // ── Renderer ─────────────────────────────────────────────────────────────
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
    group.rotation.x = GLOBE_TUNING.motion.defaultRotX
    group.rotation.y = GLOBE_TUNING.motion.defaultRotY
    scene.add(group)

    // ── Lighting ─────────────────────────────────────────────────────────────
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

    // ── Atmosphere shells ────────────────────────────────────────────────────
    const innerAtmo = buildInnerAtmosphere(GLOBE_TUNING)
    const outerHalo = buildOuterHalo(GLOBE_TUNING)
    disposables.push(innerAtmo.geometry, innerAtmo.material as THREE.Material)
    disposables.push(outerHalo.geometry, outerHalo.material as THREE.Material)
    scene.add(innerAtmo)
    scene.add(outerHalo)

    // ── Route & node state ───────────────────────────────────────────────────
    let routes: RouteObject[] = []
    let rippleSystem: RippleSystem | null = null
    let nodeVisuals: NodeVisual[] = []
    let interactionCtrl: ReturnType<typeof createInteractionController> | null = null

    // ── Hero sequence state ──────────────────────────────────────────────────
    let heroStartedAt = -1
    const rippleTimers = new Map<string, number>()
    let nodeVisualMap = new Map<string, NodeVisual>()
    let routeMap = new Map<string, RouteObject>()

    // ── Helper functions ─────────────────────────────────────────────────────
    function setRouteVisibility(route: RouteObject, k: number, strength: 'hero' | 'support') {
      const style = ROUTE_STYLE[strength]
      ;(route.tube.material as THREE.MeshBasicMaterial).opacity = k * style.core
      ;(route.glowTube.material as THREE.MeshBasicMaterial).opacity = k * style.mid
    }

    function setWaveRings(route: RouteObject, travelT: number, routeAlpha: number, pulseStrength: number) {
      route.waveRings.forEach(wave => {
        const waveT = Math.max(0, Math.min(1, travelT + wave.offsetT))
        const ptIdx = Math.min(Math.floor(waveT * route.points.length), route.points.length - 1)
        const pos = route.points[ptIdx]
        wave.mesh.position.copy(pos)

        // Orient ring perpendicular to arc travel direction
        const nextIdx = Math.min(ptIdx + 1, route.points.length - 1)
        if (nextIdx !== ptIdx) {
          const nextPos = route.points[nextIdx]
          const dir = nextPos.clone().sub(pos).normalize()
          wave.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
        }

        wave.mat.opacity = routeAlpha * wave.baseOpacity * pulseStrength
      })
    }

    function hideWaveRings(route: RouteObject) {
      route.waveRings.forEach(wave => { wave.mat.opacity = 0 })
    }

    function triggerRippleOnce(beatId: string, nowMs: number) {
      if (!rippleTimers.has(beatId)) {
        rippleTimers.set(beatId, nowMs)
        // Spawn concentric ripple rings at the destination node
        const beat = HERO_SEQUENCE.find(b => b.id === beatId)
        if (beat && rippleSystem) {
          const node = nodeVisualMap.get(beat.to)
          if (node) {
            // node.pos is the sphere-surface position used for glow/core mesh placement
            rippleSystem.spawnNodeRipple(node.pos.clone(), nowMs, '#8eaddc')
          }
        }
      }
    }

    function updateHeroSequence(
      nowMs: number,
      visMap: Map<string, NodeVisual>,
      rMap: Map<string, RouteObject>,
    ) {
      const t = nowMs - heroStartedAt

      // Reset all nodes to idle
      visMap.forEach(node => setNodeState(node, 'idle', nowMs))

      // Reset all routes to invisible
      rMap.forEach(route => {
        setRouteVisibility(route, 0, 'support')
        hideWaveRings(route)
      })

      // Process each beat
      for (const beat of HERO_SEQUENCE) {
        const local = t - beat.startMs
        if (local < 0) continue

        const route = rMap.get(beat.id)
        if (!route) continue

        const total = beat.launchMs + beat.travelMs + beat.arrivalMs + beat.cooldownMs
        if (local > total) continue

        if (local <= beat.launchMs) {
          const k = local / beat.launchMs
          const fromNode = visMap.get(beat.from)
          if (fromNode) setNodeState(fromNode, 'send', nowMs)
          setRouteVisibility(route, k, beat.strength)
          continue
        }

        if (local <= beat.launchMs + beat.travelMs) {
          const travelT = (local - beat.launchMs) / beat.travelMs
          const fromNode = visMap.get(beat.from)
          if (fromNode) setNodeState(fromNode, 'send', nowMs)
          setRouteVisibility(route, 1, beat.strength)
          const pulseStrength = beat.strength === 'hero' ? ROUTE_STYLE.hero.pulse : ROUTE_STYLE.support.pulse
          setWaveRings(route, travelT, 1, pulseStrength)
          continue
        }

        if (local <= beat.launchMs + beat.travelMs + beat.arrivalMs) {
          const toNode = visMap.get(beat.to)
          if (toNode) setNodeState(toNode, 'receive', nowMs)
          setRouteVisibility(route, 1, beat.strength)
          triggerRippleOnce(beat.id, nowMs)
          continue
        }

        // Cooldown fade
        const fadeT = (local - beat.launchMs - beat.travelMs - beat.arrivalMs) / beat.cooldownMs
        setRouteVisibility(route, 1 - fadeT, beat.strength)
      }

      // Update ripple system (node arrival rings)
      if (rippleSystem) rippleSystem.update(nowMs)
    }

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
          // Add arc wave rings to scene
          r.waveRings.forEach(wave => {
            disposables.push(wave.mesh.geometry, wave.mat)
            group.add(wave.mesh)
          })
        })

        // Ripple system for node arrival rings
        rippleSystem = new RippleSystem(group)

        // Nodes
        nodeVisuals = buildNodes(NODES, GLOBE_TUNING.radius)
        nodeVisuals.forEach(n => {
          disposables.push(n.glow.geometry, n.glowMat)
          disposables.push(n.core.geometry, n.core.material as THREE.Material)
          disposables.push(n.highlight.geometry, n.hiMat)
          group.add(n.group)
        })

        // ── Build lookup maps ───────────────────────────────────────────────
        nodeVisualMap = new Map<string, NodeVisual>()
        nodeVisuals.forEach(n => nodeVisualMap.set(n.id, n))

        routeMap = new Map<string, RouteObject>()
        const routeIds = [
          'london-brussels',
          'brussels-lagos',
          'lagos-nairobi',
          'nairobi-new-york',
          'london-new-york',
          'london-lagos',
        ]
        routes.forEach((r, i) => {
          if (routeIds[i]) routeMap.set(routeIds[i], r)
        })

        // Start hero sequence timer
        heroStartedAt = Date.now()

        // ── Interaction ─────────────────────────────────────────────────────
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

      const nowMs = Date.now()

      // ── Globe motion ────────────────────────────────────────────────────────
      const { defaultRotY, defaultRotX, sweepAmplitude, sweepPeriod } = GLOBE_TUNING.motion

      if (prefersReducedMotion) {
        group.rotation.y = defaultRotY
        group.rotation.x = defaultRotX
      } else if (heroStartedAt > 0) {
        const elapsed = nowMs - heroStartedAt
        const isInHeroSequence = elapsed < 10000

        if (isInHeroSequence) {
          // Nearly static during the 10s authored narrative — only micro drift
          const { idleYawAmplitude, idlePitchAmplitude, idlePeriodMs } = HERO_MOTION
          const microYaw = idleYawAmplitude * Math.sin((nowMs / idlePeriodMs) * Math.PI * 2)
          const microPitch = idlePitchAmplitude * Math.sin((nowMs / idlePeriodMs) * Math.PI * 1.3)
          group.rotation.y = defaultRotY + microYaw
          group.rotation.x = defaultRotX + microPitch
        } else {
          // After 10s: slow biased drift toward Americas
          const sweepT = (nowMs % sweepPeriod) / sweepPeriod
          const rawSin = Math.sin(sweepT * Math.PI * 2)
          const biasedSweep = Math.sign(rawSin) * Math.pow(Math.abs(rawSin), 2.2)
          const sweepAngle = sweepAmplitude * biasedSweep * 0.65
          const pitchBreath = (1.2 * Math.PI / 180) * Math.sin(nowMs * 0.000065)

          if (interactionCtrl) {
            interactionCtrl.update()
          } else {
            group.rotation.y += (defaultRotY + sweepAngle - group.rotation.y) * 0.0008
            group.rotation.x += (defaultRotX + pitchBreath - group.rotation.x) * 0.0008
          }
        }
      } else {
        // Waiting for geo data — slow drift
        group.rotation.y += 0.00040
      }

      // ── Hero sequence ───────────────────────────────────────────────────────
      if (heroStartedAt > 0 && nodeVisualMap.size > 0 && routeMap.size > 0) {
        updateHeroSequence(nowMs, nodeVisualMap, routeMap)
      } else {
        // Pre-load: idle nodes
        nodeVisuals.forEach(node => setNodeState(node, 'idle', nowMs))
      }

      renderer.render(scene, camera)
    }

    animate()

    // ── Responsive resize ────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver(() => {
      if (!mount) return
      const isMobileNow = window.innerWidth <= 600
      const isTabletNow = window.innerWidth > 600 && window.innerWidth <= 1024
      const w = isMobileNow ? 280 : isTabletNow ? 380 : mount.clientWidth
      const h = w
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
      if (rippleSystem) rippleSystem.dispose()
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
