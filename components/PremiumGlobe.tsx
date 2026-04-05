'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  GLOBE_TUNING,
  PALETTE,
  NODES,
  ROUTES,
  HERO_SEQUENCE,
  ROUTE_STYLE,
  HERO_MOTION,
} from './globe/tuning'
import { buildLandMeshes, buildCoastlines, buildBorders, buildGraticule } from './globe/geo'
import { buildInnerAtmosphere, buildOuterHalo } from './globe/atmosphere'
import { buildRoutes, type RouteObject } from './globe/routes'
import { buildNodes, setNodeState, updateNodeVisual, setNodeEdgeAttenuation, type NodeVisual } from './globe/nodes'
import { buildLighting } from './globe/lighting'
import { RippleSystem } from './globe/ripples'

interface PremiumGlobeProps {
  size?: number
  quality?: 'auto' | 'high' | 'medium'
  interactive?: boolean
  className?: string
}

type DisposableLike = { dispose(): void }

type RuntimeState = {
  assetsReady: boolean
  heroStartedAt: number | null
  pausedAccumMs: number
  hiddenAt: number | null
  currentCycle: number
  triggeredRipples: Set<string>
  nodeVisualMap: Map<string, NodeVisual>
  routeMap: Map<string, RouteObject>
  routes: RouteObject[]
  nodeVisuals: NodeVisual[]
  rippleSystem: RippleSystem | null
  graticuleMaterial: THREE.LineBasicMaterial | null
  pointerTargetX: number
  pointerTargetY: number
  pointerCurrentX: number
  pointerCurrentY: number
}

const HERO_SEQUENCE_DURATION =
  HERO_SEQUENCE.reduce((max, beat) => {
    const end =
      beat.startMs +
      beat.launchMs +
      beat.travelMs +
      beat.arrivalMs +
      beat.cooldownMs
    return Math.max(max, end)
  }, 0) + 1400

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

function getProfile(
  viewportWidth: number,
  quality: PremiumGlobeProps['quality'],
  requestedSize: number,
  mount: HTMLDivElement,
) {
  const isMobile = viewportWidth <= 600
  const isTablet = viewportWidth > 600 && viewportWidth <= 1024

  if (quality === 'high') {
    return {
      isMobile,
      isTablet,
      renderSize: Math.max(320, Math.min(requestedSize, mount.clientWidth || requestedSize)),
      sphereSegments: 96,
      pixelRatioCap: 2,
    }
  }

  if (quality === 'medium') {
    return {
      isMobile,
      isTablet,
      renderSize: isMobile ? 280 : isTablet ? 380 : Math.max(320, Math.min(requestedSize, mount.clientWidth || requestedSize)),
      sphereSegments: isMobile ? 40 : isTablet ? 56 : 72,
      pixelRatioCap: isMobile ? 1.5 : 1.75,
    }
  }

  // auto
  return {
    isMobile,
    isTablet,
    renderSize: isMobile ? 280 : isTablet ? 380 : Math.max(320, Math.min(requestedSize, mount.clientWidth || requestedSize)),
    sphereSegments: isMobile ? 32 : isTablet ? 48 : 64,
    pixelRatioCap: isMobile ? 1.5 : 2,
  }
}

function getRouteIdFromConfig(config: { id?: string; from: string; to: string }) {
  return config.id ?? `${config.from}-${config.to}`
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

    let disposed = false
    let rafId = 0

    const runtime: RuntimeState = {
      assetsReady: false,
      heroStartedAt: null,
      pausedAccumMs: 0,
      hiddenAt: null,
      currentCycle: -1,
      triggeredRipples: new Set<string>(),
      nodeVisualMap: new Map<string, NodeVisual>(),
      routeMap: new Map<string, RouteObject>(),
      routes: [],
      nodeVisuals: [],
      rippleSystem: null,
      graticuleMaterial: null,
      pointerTargetX: 0,
      pointerTargetY: 0,
      pointerCurrentX: 0,
      pointerCurrentY: 0,
    }

    const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)')
    let prefersReducedMotion = reduceMotionMQ.matches

    const disposables: DisposableLike[] = []

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.setClearColor(0x000000, 0)

    const initialProfile = getProfile(window.innerWidth, quality, size, mount)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, initialProfile.pixelRatioCap))
    renderer.setSize(initialProfile.renderSize, initialProfile.renderSize)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.z = 8.5

    const group = new THREE.Group()
    group.rotation.x = GLOBE_TUNING.motion.defaultRotX
    group.rotation.y = GLOBE_TUNING.motion.defaultRotY
    scene.add(group)

    const lights = buildLighting()
    lights.forEach((light) => scene.add(light))

    const sphereGeom = new THREE.SphereGeometry(
      GLOBE_TUNING.radius,
      initialProfile.sphereSegments,
      initialProfile.sphereSegments,
    )
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: PALETTE.oceanBase,
      roughness: 0.92,
      metalness: 0.0,
      clearcoat: 0.04,
      clearcoatRoughness: 0.94,
    })
    disposables.push(sphereGeom, sphereMat)
    const sphere = new THREE.Mesh(sphereGeom, sphereMat)
    group.add(sphere)

    const innerAtmo = buildInnerAtmosphere(GLOBE_TUNING)
    const outerHalo = buildOuterHalo(GLOBE_TUNING)
    disposables.push(innerAtmo.geometry, innerAtmo.material as THREE.Material)
    disposables.push(outerHalo.geometry, outerHalo.material as THREE.Material)
    scene.add(innerAtmo)
    scene.add(outerHalo)

    const applyRendererSize = () => {
      if (disposed) return
      const profile = getProfile(window.innerWidth, quality, size, mount)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap))
      renderer.setSize(profile.renderSize, profile.renderSize)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }

    const setRouteVisibility = (
      route: RouteObject,
      amount: number,
      strength: 'hero' | 'support',
    ) => {
      const style = ROUTE_STYLE[strength]
      ;(route.tube.material as THREE.MeshBasicMaterial).opacity = style.core * amount
      ;(route.glowTube.material as THREE.MeshBasicMaterial).opacity = style.mid * amount
      ;(route.haloLine.material as THREE.LineBasicMaterial).opacity = style.outer * amount
    }

    const setRoutePulse = (
      route: RouteObject,
      travelT: number,
      strength: 'hero' | 'support',
    ) => {
      const style = ROUTE_STYLE[strength]
      const idx = Math.min(
        Math.floor(travelT * (route.points.length - 1)),
        route.points.length - 1,
      )

      route.pulse.position.copy(route.points[idx])

      const edgeFade =
        travelT < 0.08
          ? travelT / 0.08
          : travelT > 0.92
          ? (1 - travelT) / 0.08
          : 1

      route.pulseMat.opacity = style.pulse * edgeFade

      route.waveRings.forEach((wave) => {
        const waveT = clamp01(travelT + wave.offsetT)
        const waveIdx = Math.min(
          Math.floor(waveT * (route.points.length - 1)),
          route.points.length - 1,
        )
        const pos = route.points[waveIdx]
        wave.mesh.position.copy(pos)

        const nextIdx = Math.min(waveIdx + 1, route.points.length - 1)
        if (nextIdx > waveIdx) {
          const nextPos = route.points[nextIdx]
          const dir = nextPos.clone().sub(pos).normalize()
          wave.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
        }

        wave.mat.opacity = wave.baseOpacity * style.pulse
      })
    }

    const hideRoutePulse = (route: RouteObject) => {
      route.pulseMat.opacity = 0
      route.waveRings.forEach((wave) => { wave.mat.opacity = 0 })
    }

    const resetVisualState = (nowMs: number) => {
      runtime.nodeVisualMap.forEach((node) => setNodeState(node, 'idle', nowMs))
      runtime.routeMap.forEach((route) => {
        setRouteVisibility(route, 0, 'support')
        hideRoutePulse(route)
      })
    }

    const getEffectiveHeroElapsed = (nowMs: number) => {
      if (runtime.heroStartedAt === null) return 0
      return nowMs - runtime.heroStartedAt - runtime.pausedAccumMs
    }

    const triggerRippleOnce = (beatId: string, cycleIndex: number, nowMs: number) => {
      const key = `${cycleIndex}:${beatId}`
      if (runtime.triggeredRipples.has(key)) return
      runtime.triggeredRipples.add(key)

      const beat = HERO_SEQUENCE.find((b) => b.id === beatId)
      if (!beat || !runtime.rippleSystem) return

      const node = runtime.nodeVisualMap.get(beat.to)
      if (!node) return

      runtime.rippleSystem.spawnNodeRipple(node.pos.clone(), nowMs, '#8eaddc')
    }

    const updateHeroSequence = (nowMs: number) => {
      if (!runtime.assetsReady || runtime.heroStartedAt === null) return

      const elapsed = getEffectiveHeroElapsed(nowMs)
      const cycleIndex = Math.floor(elapsed / HERO_SEQUENCE_DURATION)
      const t = elapsed % HERO_SEQUENCE_DURATION

      if (cycleIndex !== runtime.currentCycle) {
        runtime.currentCycle = cycleIndex
        runtime.triggeredRipples.clear()
      }

      resetVisualState(nowMs)

      let hasActiveBeat = false

      for (const beat of HERO_SEQUENCE) {
        const local = t - beat.startMs
        if (local < 0) continue

        const route = runtime.routeMap.get(beat.id)
        if (!route) continue

        const total = beat.launchMs + beat.travelMs + beat.arrivalMs + beat.cooldownMs
        if (local > total) continue

        hasActiveBeat = true

        const fromNode = runtime.nodeVisualMap.get(beat.from)
        const toNode = runtime.nodeVisualMap.get(beat.to)

        if (local <= beat.launchMs) {
          const k = clamp01(local / beat.launchMs)
          if (fromNode) setNodeState(fromNode, 'send', nowMs)
          setRouteVisibility(route, k, beat.strength)
          continue
        }

        if (local <= beat.launchMs + beat.travelMs) {
          const travelT = clamp01((local - beat.launchMs) / beat.travelMs)
          if (fromNode) setNodeState(fromNode, 'send', nowMs)
          setRouteVisibility(route, 1, beat.strength)
          setRoutePulse(route, travelT, beat.strength)
          continue
        }

        if (local <= beat.launchMs + beat.travelMs + beat.arrivalMs) {
          if (toNode) setNodeState(toNode, 'receive', nowMs)
          setRouteVisibility(route, 1, beat.strength)
          hideRoutePulse(route)
          triggerRippleOnce(beat.id, cycleIndex, nowMs)
          continue
        }

        const fadeT = clamp01(
          (local - beat.launchMs - beat.travelMs - beat.arrivalMs) / beat.cooldownMs,
        )
        setRouteVisibility(route, 1 - fadeT, beat.strength)
        hideRoutePulse(route)
      }

      if (runtime.graticuleMaterial) {
        const targetOpacity = hasActiveBeat ? 0.018 : 0.024
        runtime.graticuleMaterial.opacity +=
          (targetOpacity - runtime.graticuleMaterial.opacity) * 0.08
      }

      runtime.rippleSystem?.update(nowMs)
    }

    const getBaseRotation = (nowMs: number) => {
      const { defaultRotX, defaultRotY, sweepAmplitude, sweepPeriod } = GLOBE_TUNING.motion

      if (prefersReducedMotion) {
        return { x: defaultRotX, y: defaultRotY }
      }

      // Before assets load: slow idle drift so globe is already moving on first paint
      if (runtime.heroStartedAt === null) {
        return {
          x: defaultRotX,
          y: defaultRotY + (nowMs * 0.00018) % (Math.PI * 2),
        }
      }

      const elapsed = getEffectiveHeroElapsed(nowMs)
      const isInHeroSequence = elapsed < 10000

      if (isInHeroSequence) {
        const { idleYawAmplitude, idlePitchAmplitude, idlePeriodMs } = HERO_MOTION
        return {
          y: defaultRotY + idleYawAmplitude * Math.sin((nowMs / idlePeriodMs) * Math.PI * 2),
          x: defaultRotX + idlePitchAmplitude * Math.sin((nowMs / idlePeriodMs) * Math.PI * 1.3),
        }
      }

      const sweepT = (elapsed % sweepPeriod) / sweepPeriod
      const rawSin = Math.sin(sweepT * Math.PI * 2)
      const biasedSweep = Math.sign(rawSin) * Math.pow(Math.abs(rawSin), 2.2)

      return {
        y: defaultRotY + sweepAmplitude * biasedSweep * 0.65,
        x: defaultRotX + (1.2 * Math.PI / 180) * Math.sin(nowMs * 0.000065),
      }
    }

    let isDragging = false
    let dragLastX = 0
    let dragLastY = 0
    let dragVelX = 0
    let dragVelY = 0
    let dragOffsetX = 0
    let dragOffsetY = 0

    const onPointerDown = (event: PointerEvent) => {
      if (!interactive) return
      isDragging = true
      dragLastX = event.clientX
      dragLastY = event.clientY
      dragVelX = 0
      dragVelY = 0
      renderer.domElement.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!interactive || prefersReducedMotion) return

      if (isDragging) {
        const dx = event.clientX - dragLastX
        const dy = event.clientY - dragLastY
        dragVelX = dy * 0.004
        dragVelY = dx * 0.004
        dragOffsetX += dragVelX
        dragOffsetY += dragVelY
        dragLastX = event.clientX
        dragLastY = event.clientY
        return
      }

      // Hover parallax (desktop only)
      const profile = getProfile(window.innerWidth, quality, size, mount)
      if (profile.isMobile) return
      const rect = renderer.domElement.getBoundingClientRect()
      const nx = (event.clientX - rect.left) / rect.width - 0.5
      const ny = (event.clientY - rect.top) / rect.height - 0.5
      runtime.pointerTargetY = nx * 0.055
      runtime.pointerTargetX = -ny * 0.028
    }

    const onPointerUp = (event: PointerEvent) => {
      isDragging = false
      renderer.domElement.releasePointerCapture(event.pointerId)
    }

    const onPointerLeave = () => {
      if (!isDragging) {
        runtime.pointerTargetX = 0
        runtime.pointerTargetY = 0
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        runtime.hiddenAt = performance.now()
      } else if (runtime.hiddenAt !== null) {
        runtime.pausedAccumMs += performance.now() - runtime.hiddenAt
        runtime.hiddenAt = null
      }
    }

    const onReducedMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibilityChange)
    reduceMotionMQ.addEventListener('change', onReducedMotionChange)

    const abortCtrl = new AbortController()

    fetch('/world-110m.json', { signal: abortCtrl.signal })
      .then((r) => r.json())
      .then((world) => {
        if (disposed) return

        const landMeshes = buildLandMeshes(world, GLOBE_TUNING.radius)
        landMeshes.forEach((mesh) => {
          disposables.push(mesh.geometry)
          group.add(mesh)
        })
        if (landMeshes.length > 0) {
          disposables.push(landMeshes[0].material as THREE.Material)
        }

        const coastlines = buildCoastlines(world, GLOBE_TUNING.radius)
        disposables.push(coastlines.geometry, coastlines.material as THREE.Material)
        group.add(coastlines)

        const borders = buildBorders(world, GLOBE_TUNING.radius)
        disposables.push(borders.geometry, borders.material as THREE.Material)
        group.add(borders)

        const graticule = buildGraticule(GLOBE_TUNING.radius)
        runtime.graticuleMaterial = graticule.material as THREE.LineBasicMaterial
        runtime.graticuleMaterial.opacity = 0.024
        disposables.push(graticule.geometry, graticule.material as THREE.Material)
        group.add(graticule)

        const nodeMap: Record<string, { lat: number; lng: number }> = {}
        NODES.forEach((n) => { nodeMap[n.id] = { lat: n.lat, lng: n.lng } })

        runtime.routes = buildRoutes(nodeMap, ROUTES)
        runtime.routes.forEach((route) => {
          disposables.push(route.tube.geometry, route.tube.material as THREE.Material)
          disposables.push(route.glowTube.geometry, route.glowTube.material as THREE.Material)
          disposables.push(route.haloLine.geometry, route.haloLine.material as THREE.Material)
          disposables.push(route.pulse.geometry, route.pulseMat)
          group.add(route.haloLine)
          group.add(route.glowTube)
          group.add(route.tube)
          group.add(route.pulse)

          route.waveRings.forEach((wave) => {
            disposables.push(wave.mesh.geometry, wave.mat)
            group.add(wave.mesh)
          })
        })

        runtime.rippleSystem = new RippleSystem(group)

        runtime.nodeVisuals = buildNodes(NODES, GLOBE_TUNING.radius)
        runtime.nodeVisuals.forEach((node) => {
          disposables.push(node.glow.geometry, node.glowMat)
          disposables.push(node.core.geometry, node.coreMat)
          disposables.push(node.highlight.geometry, node.hiMat)
          group.add(node.group)
        })

        runtime.nodeVisualMap = new Map(runtime.nodeVisuals.map((node) => [node.id, node]))

        // Build from route.id directly — routes are now self-describing
        runtime.routeMap = new Map(runtime.routes.map((route) => [route.id, route]))

        for (const beat of HERO_SEQUENCE) {
          if (!runtime.routeMap.has(beat.id)) {
            console.warn(`Missing route for hero beat "${beat.id}"`)
          }
        }

        runtime.assetsReady = true
        runtime.heroStartedAt = performance.now()
        runtime.currentCycle = -1
        runtime.pausedAccumMs = 0
        runtime.hiddenAt = null
        runtime.triggeredRipples.clear()
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error('Globe geo fetch failed:', err)
        }
      })

    const animate = (nowMs: number) => {
      if (disposed) return
      rafId = requestAnimationFrame(animate)

      const base = getBaseRotation(nowMs)

      runtime.pointerCurrentX += (runtime.pointerTargetX - runtime.pointerCurrentX) * 0.08
      runtime.pointerCurrentY += (runtime.pointerTargetY - runtime.pointerCurrentY) * 0.08

      // Drag velocity decay
      if (!isDragging) {
        dragVelX *= 0.92
        dragVelY *= 0.92
        dragOffsetX += dragVelX
        dragOffsetY += dragVelY
      }

      const finalX = base.x + runtime.pointerCurrentX + dragOffsetX
      const finalY = base.y + runtime.pointerCurrentY + dragOffsetY

      const ease = runtime.assetsReady ? 0.03 : 0.012
      group.rotation.x += (finalX - group.rotation.x) * ease
      group.rotation.y += (finalY - group.rotation.y) * ease

      if (runtime.assetsReady) {
        updateHeroSequence(nowMs)
      } else {
        runtime.nodeVisuals.forEach((node) => setNodeState(node, 'idle', nowMs))
      }

      // Update node visuals with limb attenuation — prevents stray blue pinpricks at edge
      runtime.nodeVisuals.forEach((node) => {
        const nodeDir = node.pos.clone().normalize()
        // Apply group rotation to get world-space direction
        const worldDir = nodeDir.clone().applyQuaternion(group.quaternion)
        const cameraDir = camera.position.clone().normalize()
        const facing = worldDir.dot(cameraDir)
        const edgeAttenuation = THREE.MathUtils.clamp((facing + 0.08) / 0.28, 0, 1)
        setNodeEdgeAttenuation(node, edgeAttenuation)
        updateNodeVisual(node, nowMs)
      })

      renderer.render(scene, camera)
    }

    rafId = requestAnimationFrame(animate)

    const resizeObserver = new ResizeObserver(() => { applyRendererSize() })
    resizeObserver.observe(mount)

    return () => {
      disposed = true
      abortCtrl.abort()
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      reduceMotionMQ.removeEventListener('change', onReducedMotionChange)
      runtime.rippleSystem?.dispose()
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [interactive, quality, size])

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
