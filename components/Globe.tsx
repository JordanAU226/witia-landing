'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const cities = [
  { name: 'London', lat: 51.5, lng: -0.1, color: '#00c2ff' },
  { name: 'Birmingham', lat: 52.5, lng: -1.9, color: '#00c2ff' },
  { name: 'New York', lat: 40.7, lng: -74.0, color: '#00c2ff' },
  { name: 'Lagos', lat: 6.5, lng: 3.4, color: '#00c2ff' },
  { name: 'Nairobi', lat: -1.3, lng: 36.8, color: '#00c2ff' },
  { name: 'Singapore', lat: 1.3, lng: 103.8, color: '#00c2ff' },
  { name: 'Brussels', lat: 50.8, lng: 4.4, color: '#00c2ff' },
  { name: 'Dubai', lat: 25.2, lng: 55.3, color: '#00c2ff' },
  { name: 'Washington DC', lat: 38.9, lng: -77.0, color: '#00c2ff' },
  { name: 'Toronto', lat: 43.7, lng: -79.4, color: '#00c2ff' },
]

const arcPairs = [
  ['London', 'Birmingham'],
  ['London', 'New York'],
  ['London', 'Brussels'],
  ['Birmingham', 'Brussels'],
  ['New York', 'Washington DC'],
  ['New York', 'Toronto'],
  ['Lagos', 'London'],
  ['Nairobi', 'Dubai'],
  ['Dubai', 'Singapore'],
  ['Singapore', 'New York'],
  ['London', 'Lagos'],
  ['Brussels', 'Nairobi'],
]

function latLngToVector3(lat: number, lng: number, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function getArcMidpoint(v1: THREE.Vector3, v2: THREE.Vector3, altitude = 0.4) {
  const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5)
  mid.normalize().multiplyScalar(1 + altitude)
  return mid
}

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.z = 2.8

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x000000, 0)

    // Globe sphere with custom shader
    const globeRadius = 1
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64)
    const globeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color('#0a1628') },
        gridColor: { value: new THREE.Color('#00b4ff') },
        gridOpacity: { value: 0.15 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 gridColor;
        uniform float gridOpacity;
        varying vec2 vUv;
        varying vec3 vNormal;

        float grid(vec2 uv, float lineWidth) {
          vec2 grid = abs(fract(uv - 0.5) - 0.5) / fwidth(uv);
          float line = min(grid.x, grid.y);
          return 1.0 - min(line, 1.0);
        }

        void main() {
          // Lat/lng grid: 24 divisions longitude, 12 divisions latitude
          vec2 gridUv = vec2(vUv.x * 24.0, vUv.y * 12.0);
          float g = grid(gridUv, 0.5);

          vec3 col = baseColor;
          col = mix(col, gridColor, g * gridOpacity);

          // Subtle limb darkening
          float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
          col = mix(col, col * 0.7, rim * rim * 0.6);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
    const globe = new THREE.Mesh(globeGeometry, globeMaterial)
    scene.add(globe)

    // Atmosphere
    const atmGeometry = new THREE.SphereGeometry(globeRadius * 1.15, 64, 64)
    const atmMaterial = new THREE.ShaderMaterial({
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          intensity = max(0.0, intensity);
          gl_FragColor = vec4(0.0, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    const atmosphere = new THREE.Mesh(atmGeometry, atmMaterial)
    scene.add(atmosphere)

    // City nodes
    const cityMap: Record<string, THREE.Vector3> = {}
    cities.forEach((city) => {
      const pos = latLngToVector3(city.lat, city.lng, globeRadius)
      cityMap[city.name] = pos

      // Core node
      const nodeGeo = new THREE.SphereGeometry(0.015, 16, 16)
      const nodeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(city.color),
      })
      const node = new THREE.Mesh(nodeGeo, nodeMat)
      node.position.copy(pos)
      globe.add(node)

      // Glow halo
      const glowGeo = new THREE.SphereGeometry(0.035, 16, 16)
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(city.color),
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      glow.position.copy(pos)
      globe.add(glow)
    })

    // Arcs
    interface ArcState {
      startTime: number
      duration: number
      pair: string[]
      tubeMesh: THREE.Mesh
      pulseMesh: THREE.Mesh
      curve: THREE.QuadraticBezierCurve3
    }

    const arcStates: ArcState[] = arcPairs.map((pair, i) => {
      const v1 = cityMap[pair[0]]
      const v2 = cityMap[pair[1]]
      const mid = getArcMidpoint(v1, v2, 0.4)
      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2)

      const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.003, 8, false)
      const tubeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#00c2ff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
      const tube = new THREE.Mesh(tubeGeo, tubeMat)
      globe.add(tube)

      // Pulse traveller
      const pulseGeo = new THREE.SphereGeometry(0.008, 12, 12)
      const pulseMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
      const pulse = new THREE.Mesh(pulseGeo, pulseMat)
      globe.add(pulse)

      return {
        startTime: Date.now() + i * 800,
        duration: 5000,
        pair,
        tubeMesh: tube,
        pulseMesh: pulse,
        curve,
      }
    })

    // Rotation & interaction
    let rotationSpeed = 0.0015
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0
    let rotationX = 0
    let rotationY = 0

    const onMouseEnter = () => { rotationSpeed = 0.0003 }
    const onMouseLeave = () => {
      rotationSpeed = 0.0015
      isDragging = false
    }
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - prevMouseX
      const dy = e.clientY - prevMouseY
      rotationY += dx * 0.005
      rotationX += dy * 0.005
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }
    const onMouseUp = () => { isDragging = false }

    // Touch support
    let prevTouchX = 0
    let prevTouchY = 0
    const onTouchStart = (e: TouchEvent) => {
      isDragging = true
      prevTouchX = e.touches[0].clientX
      prevTouchY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      const dx = e.touches[0].clientX - prevTouchX
      const dy = e.touches[0].clientY - prevTouchY
      rotationY += dx * 0.005
      rotationX += dy * 0.005
      prevTouchX = e.touches[0].clientX
      prevTouchY = e.touches[0].clientY
    }
    const onTouchEnd = () => { isDragging = false }

    canvas.addEventListener('mouseenter', onMouseEnter)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart)
    canvas.addEventListener('touchmove', onTouchMove)
    canvas.addEventListener('touchend', onTouchEnd)

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(container)

    // Animation loop
    let animFrameId: number
    const animate = () => {
      animFrameId = requestAnimationFrame(animate)

      if (!isDragging) {
        rotationY += rotationSpeed
      }

      globe.rotation.y = rotationY
      globe.rotation.x = rotationX
      atmosphere.rotation.y = rotationY
      atmosphere.rotation.x = rotationX

      // Update arcs
      const now = Date.now()
      arcStates.forEach((state) => {
        const elapsed = now - state.startTime
        if (elapsed < 0) {
          ;(state.tubeMesh.material as THREE.MeshBasicMaterial).opacity = 0;
          (state.pulseMesh.material as THREE.MeshBasicMaterial).opacity = 0
          return
        }
        const cycleTime = elapsed % state.duration
        let opacity: number
        if (cycleTime < 500) {
          opacity = cycleTime / 500
        } else if (cycleTime < 4000) {
          opacity = 1
        } else {
          opacity = 1 - (cycleTime - 4000) / 1000
        }
        opacity = Math.max(0, Math.min(1, opacity))

        ;(state.tubeMesh.material as THREE.MeshBasicMaterial).opacity = opacity * 0.6
        ;(state.pulseMesh.material as THREE.MeshBasicMaterial).opacity = opacity

        // Pulse position along arc
        const t = (cycleTime / state.duration)
        const pulsePos = state.curve.getPoint(t)
        state.pulseMesh.position.copy(pulsePos)
      })

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animFrameId)
      resizeObserver.disconnect()
      canvas.removeEventListener('mouseenter', onMouseEnter)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    }
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
