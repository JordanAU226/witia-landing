'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const GLOBE_RADIUS = 1

const cities = [
  { name: 'London', lat: 51.5, lng: -0.1 },
  { name: 'Birmingham', lat: 52.5, lng: -1.9 },
  { name: 'New York', lat: 40.7, lng: -74.0 },
  { name: 'Lagos', lat: 6.5, lng: 3.4 },
  { name: 'Nairobi', lat: -1.3, lng: 36.8 },
  { name: 'Singapore', lat: 1.3, lng: 103.8 },
  { name: 'Brussels', lat: 50.8, lng: 4.4 },
  { name: 'Dubai', lat: 25.2, lng: 55.3 },
  { name: 'Washington DC', lat: 38.9, lng: -77.0 },
  { name: 'Toronto', lat: 43.7, lng: -79.4 },
]

const arcPairs = [
  ['London', 'New York'],
  ['London', 'Lagos'],
  ['London', 'Brussels'],
  ['New York', 'Washington DC'],
  ['Lagos', 'Nairobi'],
  ['Nairobi', 'Dubai'],
  ['Dubai', 'Singapore'],
  ['Singapore', 'New York'],
  ['Brussels', 'Dubai'],
  ['London', 'Toronto'],
]

function latLngToVec3(lat: number, lng: number, r = GLOBE_RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

// Create globe texture using Canvas 2D API
function createGlobeTexture(): THREE.CanvasTexture {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Deep navy background (ocean)
  ctx.fillStyle = '#0a1628'
  ctx.fillRect(0, 0, size, size)

  // Draw grid lines (lat/lng)
  ctx.strokeStyle = 'rgba(0, 180, 255, 0.12)'
  ctx.lineWidth = 0.5

  // Longitude lines (vertical)
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * size
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size)
    ctx.stroke()
  }

  // Latitude lines (horizontal)
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = ((90 - lat) / 180) * size
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y)
    ctx.stroke()
  }

  // Draw simplified continent outlines
  ctx.strokeStyle = 'rgba(0, 194, 255, 0.5)'
  ctx.fillStyle = 'rgba(15, 35, 65, 0.9)'
  ctx.lineWidth = 1.5

  function drawContinent(coords: [number, number][]) {
    ctx.beginPath()
    coords.forEach(([lng, lat], i) => {
      const x = ((lng + 180) / 360) * size
      const y = ((90 - lat) / 180) * size
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  // North America (simplified)
  drawContinent([
    [-168, 72], [-140, 70], [-120, 75], [-85, 75], [-65, 68], [-55, 50],
    [-60, 45], [-75, 45], [-80, 35], [-95, 29], [-90, 25], [-85, 22],
    [-92, 18], [-85, 10], [-77, 8], [-80, 12], [-75, 15], [-88, 20],
    [-90, 15], [-94, 18], [-103, 22], [-112, 28], [-120, 32],
    [-124, 38], [-125, 48], [-130, 55], [-140, 58], [-155, 60],
    [-165, 65], [-168, 72]
  ])

  // South America (simplified)
  drawContinent([
    [-80, 12], [-65, 10], [-60, 8], [-50, 2], [-35, -5], [-35, -10],
    [-40, -15], [-40, -22], [-45, -28], [-55, -35], [-65, -42],
    [-65, -52], [-70, -54], [-75, -50], [-72, -42], [-68, -30],
    [-70, -20], [-75, -12], [-80, -2], [-78, 5], [-80, 12]
  ])

  // Europe (simplified)
  drawContinent([
    [-10, 36], [0, 36], [15, 37], [28, 42], [30, 48], [24, 55],
    [15, 58], [5, 58], [-5, 58], [-15, 56], [-10, 50],
    [-5, 44], [0, 44], [5, 43], [15, 38], [10, 36], [-10, 36]
  ])

  // Africa (simplified)
  drawContinent([
    [-18, 16], [-15, 20], [-10, 20], [0, 15], [10, 15], [15, 18],
    [20, 20], [28, 22], [35, 22], [42, 15], [44, 12], [42, 2],
    [40, -5], [38, -12], [35, -18], [32, -25], [28, -34],
    [18, -35], [15, -30], [12, -22], [8, -15], [2, -8],
    [-2, 2], [-5, 5], [-15, 8], [-18, 16]
  ])

  // Asia (simplified)
  drawContinent([
    [28, 42], [35, 38], [42, 38], [50, 42], [60, 40], [70, 38],
    [80, 35], [90, 28], [100, 22], [105, 15], [110, 5], [120, 5],
    [125, 10], [130, 30], [140, 38], [145, 42], [140, 48],
    [130, 52], [120, 55], [110, 58], [100, 60], [90, 65],
    [80, 70], [70, 72], [55, 72], [42, 68], [35, 62],
    [28, 58], [25, 52], [28, 48], [28, 42]
  ])

  // Australia (simplified)
  drawContinent([
    [114, -22], [120, -20], [128, -18], [135, -15], [140, -18],
    [148, -20], [152, -25], [154, -30], [150, -38], [145, -40],
    [136, -38], [128, -35], [122, -34], [116, -32], [114, -28],
    [114, -22]
  ])

  // Add slight gradient/vignette
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,30,0.3)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  return new THREE.CanvasTexture(canvas)
}

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const W = container.clientWidth
    const H = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100)
    camera.position.z = 3

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)

    // Globe group — everything rotates together
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    // Globe with canvas texture
    const texture = createGlobeTexture()
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64)
    const globeMat = new THREE.MeshPhongMaterial({
      map: texture,
      specular: new THREE.Color('#001133'),
      shininess: 8,
    })
    const globe = new THREE.Mesh(globeGeo, globeMat)
    globeGroup.add(globe)

    // Lighting (in scene, not group — lights don't need to rotate)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0x4488ff, 1.2)
    dirLight.position.set(5, 3, 5)
    scene.add(dirLight)
    const backLight = new THREE.DirectionalLight(0x001144, 0.4)
    backLight.position.set(-5, -2, -3)
    scene.add(backLight)

    // Atmosphere glow — add to group so it rotates with globe
    const atmGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 64, 64)
    const atmMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float i = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          i = clamp(i, 0.0, 1.0);
          gl_FragColor = vec4(0.0, 0.55, 1.0, i * 0.8);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    const atmosphere = new THREE.Mesh(atmGeo, atmMat)
    globeGroup.add(atmosphere)

    // City nodes — add to globeGroup so they rotate with the globe
    const cityMap: Record<string, THREE.Vector3> = {}
    cities.forEach(city => {
      const pos = latLngToVec3(city.lat, city.lng, GLOBE_RADIUS + 0.01)
      cityMap[city.name] = pos

      // Bright core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00c2ff })
      )
      core.position.copy(pos)
      globeGroup.add(core)

      // Outer glow ring
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00c2ff, transparent: true, opacity: 0.2, depthWrite: false })
      )
      glow.position.copy(pos)
      globeGroup.add(glow)
    })

    // Arcs — also in globeGroup
    interface ArcData {
      curve: THREE.QuadraticBezierCurve3
      tube: THREE.Mesh
      pulse: THREE.Mesh
      pulseMat: THREE.MeshBasicMaterial
      tubeMat: THREE.MeshBasicMaterial
      offset: number
      cycleDur: number
    }

    const arcs: ArcData[] = arcPairs.map((pair, i) => {
      const v1 = cityMap[pair[0]]
      const v2 = cityMap[pair[1]]
      if (!v1 || !v2) return null

      // Arc midpoint elevated above surface
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5)
      mid.normalize().multiplyScalar(GLOBE_RADIUS + 0.5)

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2)

      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x00c2ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 48, 0.003, 8, false),
        tubeMat
      )
      globeGroup.add(tube)

      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), pulseMat)
      globeGroup.add(pulse)

      return { curve, tube, pulse, pulseMat, tubeMat, offset: i * 900, cycleDur: 4500 }
    }).filter(Boolean) as ArcData[]

    // Mouse drag
    let isDragging = false
    let prevMouse = { x: 0, y: 0 }
    let rotVel = { x: 0, y: 0.0015 }
    let isHovered = false

    const onMouseDown = (e: MouseEvent) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY } }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - prevMouse.x
      const dy = e.clientY - prevMouse.y
      rotVel.y = dx * 0.003
      rotVel.x = dy * 0.003
      prevMouse = { x: e.clientX, y: e.clientY }
    }
    const onMouseUp = () => { isDragging = false }
    const onMouseEnter = () => { isHovered = true }
    const onMouseLeave = () => { isHovered = false; isDragging = false }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseenter', onMouseEnter)
    canvas.addEventListener('mouseleave', onMouseLeave)

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    resizeObserver.observe(container)

    // Animation loop
    let rafId: number
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const now = Date.now()

      // Auto rotate entire group (globe + nodes + arcs together)
      const speed = isHovered && !isDragging ? 0.0003 : 0.0012
      if (!isDragging) {
        globeGroup.rotation.y += speed
      } else {
        globeGroup.rotation.y += rotVel.y
        globeGroup.rotation.x = Math.max(-0.8, Math.min(0.8, globeGroup.rotation.x + rotVel.x))
        rotVel.x *= 0.9
        rotVel.y *= 0.9
      }

      // Animate arcs
      arcs.forEach(arc => {
        const elapsed = (now + arc.offset) % arc.cycleDur
        const t = elapsed / arc.cycleDur

        // Fade in 0-15%, full 15-75%, fade out 75-100%
        let opacity = 0
        if (t < 0.15) opacity = t / 0.15
        else if (t < 0.75) opacity = 1
        else opacity = 1 - (t - 0.75) / 0.25

        arc.tubeMat.opacity = opacity * 0.7
        arc.pulseMat.opacity = opacity

        // Pulse position along arc
        const pulseT = (t * 1.5) % 1
        const pt = arc.curve.getPoint(pulseT)
        arc.pulse.position.copy(pt)
      })

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseenter', onMouseEnter)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      resizeObserver.disconnect()
      renderer.dispose()
      texture.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
