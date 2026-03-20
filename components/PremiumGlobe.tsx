'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { feature, mesh } from 'topojson-client'

// Network nodes
const NODES = [
  { lng: -0.1,   lat: 51.5  }, // London
  { lng: -1.9,   lat: 52.5  }, // Birmingham
  { lng: 4.4,    lat: 50.8  }, // Brussels
  { lng: -74.0,  lat: 40.7  }, // New York
  { lng: -77.0,  lat: 38.9  }, // Washington
  { lng: -112.1, lat: 33.4  }, // Phoenix
  { lng: 3.4,    lat: 6.5   }, // Lagos
  { lng: 36.8,   lat: -1.3  }, // Nairobi
  { lng: 103.8,  lat: 1.3   }, // Singapore
]

const ARC_PAIRS = [
  [0, 1], [0, 2], [0, 3], [0, 6],
  [3, 4], [3, 5], [2, 7], [6, 7],
  [7, 8], [3, 8],
]

const R = 2.06

function toSphere(lat: number, lng: number, r = R): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  )
}

function subdivide(coords: [number, number][], steps = 4): [number, number][] {
  if (coords.length < 2) return coords
  const out: [number, number][] = []
  for (let i = 0; i < coords.length - 1; i++) {
    out.push(coords[i])
    for (let s = 1; s < steps; s++) {
      const t = s / steps
      out.push([
        coords[i][0] + (coords[i+1][0] - coords[i][0]) * t,
        coords[i][1] + (coords[i+1][1] - coords[i][1]) * t,
      ])
    }
  }
  out.push(coords[coords.length - 1])
  return out
}

export default function PremiumGlobe({ size = 520 }: { size?: number }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let rafId: number

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.z = 8.5

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Globe group
    const group = new THREE.Group()
    group.rotation.x = -12 * Math.PI / 180
    group.rotation.y = 18 * Math.PI / 180
    scene.add(group)

    // --- BASE SPHERE ---
    const sphereGeo = new THREE.SphereGeometry(R, 128, 128)
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#efe9df'),
      roughness: 0.85,
      metalness: 0.01,
      clearcoat: 0.15,
      clearcoatRoughness: 0.88,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    group.add(sphere)

    // --- ATMOSPHERE ---
    const atmGeo = new THREE.SphereGeometry(R + 0.09, 64, 64)
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
    })
    group.add(new THREE.Mesh(atmGeo, atmMat))

    // --- HALO ---
    const haloGeo = new THREE.SphereGeometry(R + 0.22, 64, 64)
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#f0ece6'),
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.035,
      depthWrite: false,
    })
    group.add(new THREE.Mesh(haloGeo, haloMat))

    // --- GRATICULE ---
    const gratMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#a89880'),
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    })
    const GRAT_R = R + 0.002
    ;[...Array(18)].forEach((_, i) => {
      const lat = -85 + i * 10
      const pts: THREE.Vector3[] = []
      for (let lng = -180; lng <= 180; lng += 3) pts.push(toSphere(lat, lng, GRAT_R))
      const g = new THREE.BufferGeometry().setFromPoints(pts)
      group.add(new THREE.Line(g, gratMat))
    })
    ;[...Array(36)].forEach((_, i) => {
      const lng = -180 + i * 10
      const pts: THREE.Vector3[] = []
      for (let lat = -90; lat <= 90; lat += 3) pts.push(toSphere(lat, lng, GRAT_R))
      const g = new THREE.BufferGeometry().setFromPoints(pts)
      group.add(new THREE.Line(g, gratMat))
    })

    // --- LIGHTING ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 0.75)
    keyLight.position.set(5, 4, 6)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xf0f4ff, 0.22)
    fillLight.position.set(-4, -2, -3)
    scene.add(fillLight)
    const rimLight = new THREE.PointLight(0xffffff, 0.18, 30)
    rimLight.position.set(0, 3, 7)
    scene.add(rimLight)
    const accentLight = new THREE.DirectionalLight(0xd0e4ff, 0.08)
    accentLight.position.set(2, 0, 4)
    scene.add(accentLight)

    // --- MAP DATA ---
    const landMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.98,
      metalness: 0,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
    const coastMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#2f2923'),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
    const borderMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#453d35'),
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })

    const geoDisposables: THREE.BufferGeometry[] = []

    fetch('/world-110m.json')
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((world: any) => {
        // Land polygons
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const countries = feature(world, world.objects.countries) as any
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        countries.features.forEach((feat: any) => {
          const geom = feat.geometry
          if (!geom) return

          const rings: number[][][] = []
          if (geom.type === 'Polygon') {
            rings.push(...(geom.coordinates as number[][][]))
          } else if (geom.type === 'MultiPolygon') {
            (geom.coordinates as number[][][][]).forEach((poly: number[][][]) => rings.push(...poly))
          }

          rings.forEach(ring => {
            if (ring.length < 4) return
            const coords: [number, number][] = ring.map(([lng, lat]) => [lng, lat] as [number, number])
            const subdivided = subdivide(coords, 2)
            const pts = subdivided.map(([lng, lat]) => toSphere(lat, lng, R + 0.031))

            if (pts.length < 3) return
            const positions: number[] = []
            const normals: number[] = []
            for (let i = 1; i < pts.length - 1; i++) {
              ;[pts[0], pts[i], pts[i+1]].forEach(p => {
                positions.push(p.x, p.y, p.z)
                const n = p.clone().normalize()
                normals.push(n.x, n.y, n.z)
              })
            }
            const geo = new THREE.BufferGeometry()
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
            geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
            geoDisposables.push(geo)
            group.add(new THREE.Mesh(geo, landMat))

            // Coastline
            const coastGeo = new THREE.BufferGeometry().setFromPoints(pts)
            geoDisposables.push(coastGeo)
            group.add(new THREE.Line(coastGeo, coastMat))
          })
        })

        // Country borders
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const borders = mesh(world, world.objects.countries, (a: any, b: any) => a !== b) as any
        if (borders.type === 'MultiLineString') {
          (borders.coordinates as number[][][]).forEach(line => {
            const pts = line.map(([lng, lat]) => toSphere(lat, lng, R + 0.035))
            if (pts.length < 2) return
            const geo = new THREE.BufferGeometry().setFromPoints(pts)
            geoDisposables.push(geo)
            group.add(new THREE.Line(geo, borderMat))
          })
        }
      })
      .catch(console.error)

    // --- ARCS ---
    interface ArcData {
      pts: THREE.Vector3[]
      pulseMat: THREE.MeshBasicMaterial
      pulseMesh: THREE.Mesh
      offset: number
    }

    const arcs: ArcData[] = ARC_PAIRS.map(([i1, i2], idx) => {
      const v1 = toSphere(NODES[i1].lat, NODES[i1].lng, R + 0.04)
      const v2 = toSphere(NODES[i2].lat, NODES[i2].lng, R + 0.04)
      const mid = v1.clone().add(v2).multiplyScalar(0.5)
      mid.normalize().multiplyScalar(R + 0.38 + mid.length() * 0.05)

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2)
      const pts = curve.getPoints(80)

      // Glow line
      const glowGeo = new THREE.BufferGeometry().setFromPoints(pts)
      const glowMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#9dbfff'),
        transparent: true,
        opacity: 0.10,
        depthWrite: false,
      })
      group.add(new THREE.Line(glowGeo, glowMat))
      geoDisposables.push(glowGeo)

      // Main line
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts)
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#6e98e3'),
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      })
      group.add(new THREE.Line(lineGeo, lineMat))
      geoDisposables.push(lineGeo)

      // Pulse dot
      const pulseMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#6e98e3'),
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      })
      const pulseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), pulseMat)
      group.add(pulseMesh)

      return { pts, pulseMat, pulseMesh, offset: idx * 900 }
    })

    // --- NODES ---
    const nodePulseMats: THREE.MeshBasicMaterial[] = []
    NODES.forEach(node => {
      const pos = toSphere(node.lat, node.lng, R + 0.04)

      // Outer glow
      const outerMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#6e98e3'),
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      })
      const outer = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), outerMat)
      outer.position.copy(pos)
      group.add(outer)

      // Core
      const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#183a66') })
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), coreMat)
      core.position.copy(pos)
      group.add(core)

      // Center highlight
      const hlMat = new THREE.MeshBasicMaterial({
        color: 0xddeeff,
        transparent: true,
        opacity: 0.85,
      })
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), hlMat)
      hl.position.copy(pos)
      group.add(hl)

      nodePulseMats.push(outerMat)
    })

    // --- POINTER RESPONSE ---
    let targetRotY = group.rotation.y
    let targetRotX = group.rotation.x
    const baseRotX = group.rotation.x
    const baseRotY = group.rotation.y

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width - 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5
      targetRotY = baseRotY + nx * 0.15
      targetRotX = baseRotX + ny * -0.10
    }
    const onMouseLeave = () => {
      targetRotY = baseRotY
      targetRotX = baseRotX
    }
    mount.addEventListener('mousemove', onMouseMove)
    mount.addEventListener('mouseleave', onMouseLeave)

    // --- ANIMATION ---
    let lastTime = performance.now()
    const autoRotSpeed = 0.00045 // radians per ms

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const now = performance.now()
      const dt = now - lastTime
      lastTime = now

      // Auto drift + lerp
      targetRotY += autoRotSpeed * dt
      group.rotation.y += (targetRotY - group.rotation.y) * 0.03
      group.rotation.x += (targetRotX - group.rotation.x) * 0.03

      // Atmosphere pulse
      atmMat.opacity = 0.07 * (1 + Math.sin(now * 0.0003) * 0.003)

      // Node pulse
      nodePulseMats.forEach((mat, i) => {
        const phase = (now * 0.0008 + i * 0.7) % (Math.PI * 2)
        mat.opacity = 0.08 + Math.sin(phase) * 0.04
      })

      // Arc travelers
      arcs.forEach(arc => {
        const cycle = 4500
        const t = ((now + arc.offset) % cycle) / cycle
        const ptIdx = Math.min(Math.floor(t * arc.pts.length), arc.pts.length - 1)
        arc.pulseMesh.position.copy(arc.pts[ptIdx])
        const fade = t < 0.1 ? t / 0.1 : t > 0.9 ? (1 - t) / 0.1 : 1
        arc.pulseMat.opacity = fade * 0.9
      })

      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const ro = new ResizeObserver(() => {
      const s = Math.min(mount.clientWidth, mount.clientHeight)
      renderer.setSize(s, s)
    })
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(rafId)
      mount.removeEventListener('mousemove', onMouseMove)
      mount.removeEventListener('mouseleave', onMouseLeave)
      ro.disconnect()
      geoDisposables.forEach(g => g.dispose())
      sphereGeo.dispose()
      atmGeo.dispose()
      haloGeo.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [size])

  return (
    <div
      ref={mountRef}
      style={{ width: `${size}px`, height: `${size}px`, cursor: 'default' }}
    />
  )
}
