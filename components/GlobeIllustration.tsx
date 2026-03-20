'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const NODES = [
  { lng: -0.1,   lat: 51.5,  label: 'London' },
  { lng: -1.9,   lat: 52.5,  label: 'Birmingham' },
  { lng: 4.4,    lat: 50.8,  label: 'Brussels' },
  { lng: -74.0,  lat: 40.7,  label: 'New York' },
  { lng: -77.0,  lat: 38.9,  label: 'Washington' },
  { lng: -112.1, lat: 33.4,  label: 'Phoenix' },
  { lng: 3.4,    lat: 6.5,   label: 'Lagos' },
  { lng: 36.8,   lat: -1.3,  label: 'Nairobi' },
  { lng: 103.8,  lat: 1.3,   label: 'Singapore' },
]

const ARC_PAIRS = [
  [0, 1], [0, 2], [0, 3], [0, 6],
  [3, 4], [3, 5], [2, 7], [6, 7],
  [7, 8], [3, 8],
]

function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  )
}

// Create a canvas texture for the globe — draws lat/lng grid + coastline outlines
function createGlobeTexture(w = 2048, h = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Background — warm cream
  ctx.fillStyle = '#F5F3EF'
  ctx.fillRect(0, 0, w, h)

  // Grid lines
  ctx.strokeStyle = 'rgba(180, 168, 152, 0.25)'
  ctx.lineWidth = 0.8
  for (let lng = -180; lng <= 180; lng += 15) {
    const x = ((lng + 180) / 360) * w
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let lat = -90; lat <= 90; lat += 15) {
    const y = ((90 - lat) / 180) * h
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Coastlines — draw as thick strokes on the equirectangular texture
  // Each array is [lng, lat] pairs forming a closed polygon
  const coastlines: number[][][] = [
    // North America
    [[-52,47],[-56,47],[-60,46],[-64,44],[-67,45],[-70,43],[-74,41],
     [-76,39],[-77,35],[-80,32],[-82,30],[-85,30],[-90,29],[-92,25],
     [-97,26],[-100,28],[-109,23],[-112,28],[-117,30],[-120,34],
     [-124,40],[-124,48],[-123,49],[-104,49],[-90,49],[-82,45],
     [-80,44],[-74,45],[-70,47],[-66,45],[-64,44],[-60,46],[-54,48],
     [-57,46],[-64,48],[-70,50],[-78,54],[-84,58],[-90,62],
     [-84,66],[-80,68],[-70,70],[-65,68],[-60,65],[-55,62],
     [-57,56],[-64,54],[-70,50],[-72,48],[-68,45],[-64,44]],
    // Greenland
    [[-45,84],[-18,80],[-16,77],[-20,74],[-26,70],[-32,68],[-40,66],
     [-48,66],[-56,70],[-54,73],[-48,77],[-45,80],[-45,84]],
    // South America
    [[-80,10],[-75,4],[-68,2],[-52,4],[-48,0],[-38,-4],[-35,-10],
     [-38,-14],[-42,-24],[-52,-32],[-62,-40],[-65,-42],[-66,-52],
     [-70,-52],[-72,-44],[-70,-26],[-76,-14],[-80,-4],[-80,10]],
    // Europe
    [[-10,36],[4,36],[8,38],[14,38],[18,40],[24,42],[28,42],[30,44],
     [24,48],[20,52],[18,54],[12,56],[4,58],[0,58],[-4,58],[-8,54],
     [-10,52],[-8,50],[-4,46],[0,44],[6,44],[8,42],[14,40],[10,36],[-10,36]],
    // Scandinavia
    [[4,52],[8,54],[12,56],[20,60],[24,64],[26,66],[28,68],[22,70],
     [14,70],[8,66],[6,62],[4,58],[4,52]],
    // Africa
    [[-18,16],[-10,22],[2,18],[4,14],[4,6],[0,2],[4,-2],[8,-6],
     [14,-14],[18,-22],[22,-30],[24,-34],[28,-32],[34,-20],[38,-12],
     [42,-4],[44,4],[42,8],[38,16],[40,20],[38,4],[32,6],[28,10],
     [22,14],[16,16],[8,8],[0,8],[-6,12],[-14,10],[-18,14],[-18,16]],
    // Asia (simplified)
    [[28,42],[36,38],[40,36],[48,38],[56,42],[64,38],[68,36],[72,34],
     [80,30],[88,26],[96,20],[100,18],[104,20],[108,18],[110,16],
     [114,8],[110,4],[106,2],[102,-2],[106,-6],[110,-8],[114,-4],
     [118,0],[122,4],[124,10],[122,14],[120,22],[122,24],[126,32],
     [132,36],[136,40],[138,42],[142,46],[138,52],[126,58],[118,62],
     [100,60],[86,68],[72,70],[56,66],[44,60],[36,56],[28,52],
     [26,48],[28,44],[28,42]],
    // Australia
    [[114,-22],[118,-18],[122,-18],[126,-16],[132,-12],[136,-12],
     [140,-16],[144,-18],[148,-22],[152,-26],[154,-32],[150,-38],
     [144,-40],[136,-36],[124,-34],[118,-32],[114,-28],[114,-22]],
  ]

  // Draw coastlines as strokes
  ctx.strokeStyle = 'rgba(70, 58, 45, 0.85)'
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  coastlines.forEach(coast => {
    ctx.beginPath()
    coast.forEach(([lng, lat], i) => {
      // Handle antimeridian wrap
      const x = ((lng + 180) / 360) * w
      const y = ((90 - lat) / 180) * h
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.stroke()

    // Also fill very lightly
    ctx.fillStyle = 'rgba(200, 190, 178, 0.18)'
    ctx.fill()
  })

  // Stipple dots along coastlines
  ctx.fillStyle = 'rgba(70, 58, 45, 0.7)'
  coastlines.forEach(coast => {
    for (let i = 0; i < coast.length - 1; i++) {
      const [lng1, lat1] = coast[i]
      const [lng2, lat2] = coast[i + 1]
      const dist = Math.hypot(lng2 - lng1, lat2 - lat1)
      const steps = Math.ceil(dist * 3)
      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        const lng = lng1 + (lng2 - lng1) * t
        const lat = lat1 + (lat2 - lat1) * t
        const x = ((lng + 180) / 360) * w
        const y = ((90 - lat) / 180) * h
        ctx.beginPath()
        ctx.arc(x, y, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  })

  return new THREE.CanvasTexture(canvas)
}

export default function GlobeIllustration({ size = 480 }: { size?: number }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.z = 2.8

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Globe group
    const group = new THREE.Group()
    scene.add(group)

    // Globe sphere with texture
    const texture = createGlobeTexture()
    const globeGeo = new THREE.SphereGeometry(1, 72, 72)
    const globeMat = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 5,
      specular: new THREE.Color(0xfaf8f5),
    })
    const globe = new THREE.Mesh(globeGeo, globeMat)
    group.add(globe)

    // Subtle rim outline
    const rimGeo = new THREE.SphereGeometry(1.001, 72, 72)
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0xc0b8a8,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.4,
    })
    group.add(new THREE.Mesh(rimGeo, rimMat))

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xfff8f0, 0.6)
    sun.position.set(4, 2, 4)
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xf0f4ff, 0.2)
    fill.position.set(-4, -1, -2)
    scene.add(fill)

    // City node dots
    const nodePositions = NODES.map(n => latLngToVec3(n.lat, n.lng, 1.012))
    const nodeMeshes: THREE.Mesh[] = []
    nodePositions.forEach(pos => {
      // Core dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x0a2342 })
      )
      dot.position.copy(pos)
      group.add(dot)
      nodeMeshes.push(dot)

      // Outer ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.038, 0.004, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0x0a2342, transparent: true, opacity: 0.5 })
      )
      ring.position.copy(pos)
      ring.lookAt(new THREE.Vector3(0, 0, 0))
      ring.rotateX(Math.PI / 2)
      group.add(ring)
    })

    // Arcs
    interface ArcData {
      points: THREE.Vector3[]
      line: THREE.Line
      pulseDot: THREE.Mesh
      pulseMat: THREE.MeshBasicMaterial
      lineMat: THREE.LineBasicMaterial
      offset: number
    }

    const arcs: ArcData[] = ARC_PAIRS.map(([i1, i2], idx) => {
      const v1 = latLngToVec3(NODES[i1].lat, NODES[i1].lng, 1.01)
      const v2 = latLngToVec3(NODES[i2].lat, NODES[i2].lng, 1.01)

      // Quadratic Bezier control point — elevated above surface
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5)
      mid.normalize().multiplyScalar(1.42)

      // Sample arc into points
      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2)
      const points = curve.getPoints(60)

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x0a2342,
        transparent: true,
        opacity: 0.3,
        linewidth: 1,
      })
      const line = new THREE.Line(lineGeo, lineMat)
      group.add(line)

      // Pulse dot
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x0a2342,
        transparent: true,
        opacity: 0,
      })
      const pulseDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 12, 12),
        pulseMat
      )
      group.add(pulseDot)

      return { points, line, pulseDot, pulseMat, lineMat, offset: idx * 800 }
    })

    // Mouse drag
    let isDragging = false
    let prevX = 0
    let autoRotSpeed = 0.0008

    const onDown = (e: MouseEvent) => { isDragging = true; prevX = e.clientX }
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - prevX
      group.rotation.y += dx * 0.005
      prevX = e.clientX
    }
    const onUp = () => { isDragging = false }
    const onEnter = () => { autoRotSpeed = 0.0002 }
    const onLeave = () => { autoRotSpeed = 0.0008; isDragging = false }

    renderer.domElement.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    renderer.domElement.addEventListener('mouseenter', onEnter)
    renderer.domElement.addEventListener('mouseleave', onLeave)

    // Animation
    let rafId: number
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const now = Date.now()

      if (!isDragging) group.rotation.y += autoRotSpeed

      // Animate arcs
      arcs.forEach(arc => {
        const cycle = 3500
        const t = ((now + arc.offset) % cycle) / cycle

        // Fade arc line in/out
        const lineOpacity = t < 0.15 ? t / 0.15 : t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2
        arc.lineMat.opacity = lineOpacity * 0.35

        // Pulse dot travels along arc
        const ptIdx = Math.floor(t * arc.points.length)
        if (ptIdx < arc.points.length) {
          arc.pulseDot.position.copy(arc.points[ptIdx])
          arc.pulseMat.opacity = lineOpacity * 0.95
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const ro = new ResizeObserver(() => {
      const s = mount.clientWidth
      camera.aspect = 1
      camera.updateProjectionMatrix()
      renderer.setSize(s, s)
    })
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(rafId)
      renderer.domElement.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      renderer.domElement.removeEventListener('mouseenter', onEnter)
      renderer.domElement.removeEventListener('mouseleave', onLeave)
      ro.disconnect()
      renderer.dispose()
      texture.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [size])

  return (
    <div
      ref={mountRef}
      style={{ width: `${size}px`, height: `${size}px`, cursor: 'grab' }}
    />
  )
}
