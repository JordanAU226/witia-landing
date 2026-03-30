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
    // NY sweep visible, Africa landmass as geographic anchor
    group.rotation.x = -8 * (Math.PI / 180)
    group.rotation.y = -8 * (Math.PI / 180)
    scene.add(group)

    // ── Lighting (scene-level, not rotating) ─────────────────────────────────
    const lights = buildLighting()
    lights.forEach(l => scene.add(l))

    // ── Base sphere ──────────────────────────────────────────────────────────
    const sphereGeom = new THREE.SphereGeometry(GLOBE_TUNING.radius, 64, 64)
    disposables.push(sphereGeom)
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: PALETTE.oceanBase,
      roughness: 0.91,     // more matte — ceramic/mineral feel
      metalness: 0.0,      // zero metal
      clearcoat: 0.05,     // barely there clearcoat
      clearcoatRoughness: 0.92,
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
          disposables.push(n.highlight.geometry, n.highlight.material as THREE.Material)
          group.add(n.halo)
          group.add(n.core)
          group.add(n.highlight)
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

      // ── Animate routes ─────────────────────────────────────────────────────
      routes.forEach((route, idx) => {
        const cycle = 4200 + idx * 600
        const t = ((Date.now() + route.offset) % cycle) / cycle

        // Selective legibility: routes fade in/hold/fade out
        // Base opacity raised — routes are now selectively legible, not globally faint
        const lineAlpha =
          t < 0.10 ? t / 0.10
          : t > 0.85 ? (1 - t) / 0.15
          : 1
        ;(route.tube.material as THREE.MeshBasicMaterial).opacity = lineAlpha * 0.32
        ;(route.glowTube.material as THREE.MeshBasicMaterial).opacity = lineAlpha * 0.09

        // Pulse eased travel — slight ease-in
        const pulseT = Math.pow(t, 0.88)
        const ptIdx = Math.min(
          Math.floor(pulseT * route.points.length),
          route.points.length - 1,
        )
        route.pulse.position.copy(route.points[ptIdx])
        route.pulseMat.opacity = lineAlpha * 0.90

        // Pulse brightens near arrival (causal feel)
        const nearEnd = Math.max(0, 1 - Math.abs(t - 0.78) / 0.22)
        if (nearEnd > 0) {
          route.pulseMat.opacity = Math.min(0.98, route.pulseMat.opacity + nearEnd * 0.35)
        }
      })

      // ── Animate node halos (very subtle breathing) ──────────────────────────
      nodeObjects.forEach((node, idx) => {
        const phase = (Date.now() * 0.00055 + idx * 0.9) % (Math.PI * 2)
        // Tier 1 nodes breathe slightly more
        const baseOpacity = node.tier === 1 ? 0.09 : 0.065
        const amplitude = node.tier === 1 ? 0.022 : 0.016
        node.haloMat.opacity = baseOpacity + Math.sin(phase) * amplitude
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
