'use client'
import { useEffect, useRef } from 'react'

// High-quality simplified coastline/border coordinates [lng, lat]
// More points = more accurate continent outlines
const COASTLINES: number[][][] = [
  // North America - detailed coastline
  [
    [-52,47],[-56,47],[-60,46],[-64,44],[-66,44],[-67,45],[-70,43],
    [-71,42],[-74,41],[-76,39],[-77,35],[-80,32],[-81,31],[-82,30],
    [-85,30],[-88,30],[-90,29],[-89,26],[-92,25],[-94,26],[-97,26],
    [-97,28],[-100,28],[-105,22],[-109,23],[-110,24],[-112,28],
    [-117,30],[-118,32],[-120,34],[-122,37],[-124,40],[-124,44],
    [-124,48],[-123,49],[-120,49],[-115,49],[-110,49],[-104,49],
    [-98,49],[-90,49],[-85,47],[-82,45],[-80,44],[-78,44],[-76,44],
    [-74,45],[-72,45],[-70,47],[-68,47],[-66,45],[-64,44],[-62,45],
    [-60,46],[-58,47],[-56,47],[-54,48],[-53,47],[-54,46],[-57,46],
    [-60,47],[-64,48],[-66,49],[-70,50],[-74,52],[-78,54],[-80,56],
    [-84,58],[-88,60],[-90,62],[-88,64],[-84,66],[-80,68],[-75,70],
    [-70,70],[-65,68],[-62,66],[-60,65],[-58,64],[-55,62],[-54,60],
    [-55,58],[-57,56],[-60,55],[-64,54],[-68,52],[-70,50],[-72,48],
    [-72,46],[-68,45],[-64,44]
  ],
  // Greenland
  [
    [-45,84],[-30,83],[-18,80],[-16,77],[-20,74],[-26,70],[-32,68],
    [-40,66],[-48,66],[-54,68],[-56,70],[-54,73],[-48,77],[-45,80],[-45,84]
  ],
  // South America
  [
    [-80,10],[-77,8],[-76,6],[-75,4],[-72,2],[-68,2],[-62,2],[-55,2],
    [-52,4],[-50,2],[-48,0],[-44,-2],[-38,-4],[-35,-6],[-35,-10],
    [-38,-14],[-40,-20],[-42,-24],[-46,-28],[-52,-32],[-56,-36],
    [-62,-40],[-65,-42],[-66,-46],[-66,-52],[-68,-54],[-70,-52],
    [-72,-48],[-72,-44],[-70,-38],[-68,-32],[-70,-26],[-70,-20],
    [-76,-14],[-78,-8],[-80,-4],[-80,0],[-80,6],[-80,10]
  ],
  // Western Europe
  [
    [-10,36],[0,36],[4,36],[8,38],[14,38],[16,40],[18,40],[20,42],
    [24,42],[28,42],[30,44],[28,46],[24,48],[22,50],[20,52],[18,54],
    [16,56],[12,56],[8,58],[4,58],[0,58],[-4,58],[-6,56],[-8,54],
    [-10,52],[-8,50],[-4,48],[-4,46],[-2,44],[0,44],[4,44],[6,44],
    [8,42],[12,40],[14,40],[16,38],[12,38],[8,38],[4,36],[-2,36],[-8,36],[-10,36]
  ],
  // Northern Europe / Scandinavia
  [
    [4,52],[8,54],[12,56],[16,58],[20,60],[22,62],[24,64],[26,66],
    [28,68],[26,70],[22,70],[18,70],[14,70],[10,68],[8,66],[6,62],
    [4,58],[4,54],[4,52]
  ],
  // Africa
  [
    [-18,16],[-16,20],[-14,22],[-10,22],[-6,22],[-2,22],[2,18],
    [4,14],[6,10],[4,6],[2,4],[0,2],[2,0],[4,-2],[6,-4],[8,-6],
    [10,-8],[12,-10],[14,-14],[16,-18],[18,-22],[20,-26],[22,-30],
    [24,-34],[26,-34],[28,-32],[30,-28],[32,-24],[34,-20],[36,-16],
    [38,-12],[40,-8],[42,-4],[44,0],[44,4],[42,8],[40,12],[38,16],
    [40,20],[42,22],[44,14],[42,8],[38,4],[36,2],[34,4],[32,6],
    [30,8],[28,10],[26,12],[24,14],[22,14],[20,16],[18,16],[16,16],
    [14,14],[12,12],[10,10],[8,8],[6,8],[4,6],[2,6],[0,8],
    [-2,10],[-4,12],[-6,12],[-8,10],[-10,8],[-12,8],[-14,10],
    [-16,12],[-18,14],[-18,16]
  ],
  // Asia - Western
  [
    [28,42],[32,40],[36,38],[38,38],[40,36],[44,38],[48,38],[52,40],
    [56,42],[60,42],[62,40],[64,38],[66,36],[68,36],[70,34],[72,34],
    [76,32],[80,30],[84,28],[88,26],[90,24],[92,22],[96,20],[100,18],
    [102,18],[104,20],[106,20],[108,18],[110,16],[112,14],[114,12],
    [114,8],[110,4],[106,2],[104,0],[102,-2],[104,-4],[106,-6],
    [108,-8],[110,-8],[112,-6],[114,-4],[116,-2],[118,0],[120,2],
    [122,4],[124,6],[124,10],[122,14],[120,18],[120,22],[122,24],
    [124,28],[126,32],[130,34],[132,36],[134,38],[136,40],[138,42],
    [140,44],[142,46],[142,50],[138,52],[134,54],[130,56],[126,58],
    [122,60],[118,62],[114,64],[108,66],[100,68],[92,68],[86,68],
    [80,70],[72,70],[64,68],[56,66],[50,64],[44,60],[40,58],[36,56],
    [32,54],[28,52],[26,48],[28,44],[28,42]
  ],
  // Australia
  [
    [114,-22],[116,-20],[118,-18],[122,-18],[126,-16],[130,-14],
    [132,-12],[136,-12],[138,-14],[140,-16],[142,-18],[144,-18],
    [146,-20],[148,-22],[150,-24],[152,-26],[154,-28],[154,-32],
    [152,-36],[150,-38],[148,-40],[144,-40],[140,-38],[136,-36],
    [130,-34],[124,-34],[118,-32],[114,-28],[114,-24],[114,-22]
  ],
]

// Network nodes - represent jurisdictions in the WITIA network
const NODES = [
  { lng: -0.1, lat: 51.5, label: 'London' },
  { lng: -1.9, lat: 52.5, label: 'Birmingham' },
  { lng: 4.4, lat: 50.8, label: 'Brussels' },
  { lng: -74.0, lat: 40.7, label: 'New York' },
  { lng: -77.0, lat: 38.9, label: 'Washington' },
  { lng: -112.1, lat: 33.4, label: 'Phoenix' },
  { lng: 3.4, lat: 6.5, label: 'Lagos' },
  { lng: 36.8, lat: -1.3, label: 'Nairobi' },
  { lng: 103.8, lat: 1.3, label: 'Singapore' },
]

// Arc connections between nodes
const ARCS = [
  [0, 1], // London - Birmingham
  [0, 2], // London - Brussels
  [0, 3], // London - New York
  [0, 6], // London - Lagos
  [3, 4], // NY - Washington
  [3, 5], // NY - Phoenix
  [2, 7], // Brussels - Nairobi
  [6, 7], // Lagos - Nairobi
  [7, 8], // Nairobi - Singapore
  [3, 8], // NY - Singapore
]

function project(lng: number, lat: number, cx: number, cy: number, r: number, rotY: number) {
  const adjustedLng = lng + rotY
  const lngRad = adjustedLng * Math.PI / 180
  const latRad = lat * Math.PI / 180

  const cosLat = Math.cos(latRad)
  const sinLat = Math.sin(latRad)
  const cosLng = Math.cos(lngRad)
  const sinLng = Math.sin(lngRad)

  // Orthographic projection
  const x = r * cosLat * sinLng
  const y = -r * sinLat
  const z = cosLat * cosLng // depth (positive = facing viewer)

  return {
    x: cx + x,
    y: cy + y,
    z,
    visible: z > 0,
  }
}

function getArcPoints(
  n1: { lng: number; lat: number },
  n2: { lng: number; lat: number },
  cx: number, cy: number, r: number, rotY: number,
  steps = 60
): Array<{ x: number; y: number; z: number; visible: boolean }> {
  const points = []
  // Great circle arc
  const lat1 = n1.lat * Math.PI / 180
  const lng1 = n1.lng * Math.PI / 180
  const lat2 = n2.lat * Math.PI / 180
  const lng2 = n2.lng * Math.PI / 180

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    // Slerp between two points on unit sphere, elevated for arc
    const elevation = 0.35 * Math.sin(Math.PI * t) // arc height above surface

    const lat = lat1 + (lat2 - lat1) * t
    const lng = lng1 + (lng2 - lng1) * t

    // Slightly elevate the midpoint
    const adjustedLng = (lng * 180 / Math.PI)
    const adjustedLat = (lat * 180 / Math.PI)

    const lngRad = (adjustedLng + rotY) * Math.PI / 180
    const latRad = adjustedLat * Math.PI / 180

    const er = r * (1 + elevation)
    const cosLat = Math.cos(latRad)
    const x = er * cosLat * Math.sin(lngRad)
    const y = -er * Math.sin(latRad)
    const z = cosLat * Math.cos(lngRad)

    points.push({ x: cx + x, y: cy + y, z, visible: z > 0 })
  }
  return points
}

export default function GlobeIllustration({ size = 480, rotation = -20 }: { size?: number; rotation?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const rotRef = useRef(rotation)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const r = size * 0.42

    let lastTime = performance.now()

    function draw(now: number) {
      const dt = now - lastTime
      lastTime = now
      rotRef.current += dt * 0.006 // degrees per ms — slow, elegant
      timeRef.current = now

      ctx.clearRect(0, 0, size, size)
      const rot = rotRef.current

      // — Globe background —
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = '#F7F6F3'
      ctx.fill()
      ctx.restore()

      // — Globe outline —
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = '#C8C2B8'
      ctx.lineWidth = 1
      ctx.stroke()

      // — Clip all content to globe —
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()

      // — Graticule lines —
      ctx.strokeStyle = 'rgba(190, 182, 170, 0.35)'
      ctx.lineWidth = 0.5

      for (let lat = -75; lat <= 75; lat += 15) {
        ctx.beginPath()
        let first = true
        let prevVisible = false
        for (let lng = -180; lng <= 180; lng += 3) {
          const p = project(lng, lat, cx, cy, r, rot)
          if (!p.visible) { first = true; prevVisible = false; continue }
          if (first || !prevVisible) { ctx.moveTo(p.x, p.y); first = false }
          else ctx.lineTo(p.x, p.y)
          prevVisible = true
        }
        ctx.stroke()
      }

      for (let lng = -165; lng <= 180; lng += 15) {
        ctx.beginPath()
        let first = true
        let prevVisible = false
        for (let lat = -88; lat <= 88; lat += 3) {
          const p = project(lng, lat, cx, cy, r, rot)
          if (!p.visible) { first = true; prevVisible = false; continue }
          if (first || !prevVisible) { ctx.moveTo(p.x, p.y); first = false }
          else ctx.lineTo(p.x, p.y)
          prevVisible = true
        }
        ctx.stroke()
      }

      // — Coastlines with stipple dots along the path —
      // Draw each coastline as a series of tiny dots following the outline
      COASTLINES.forEach(coast => {
        // First draw the faint line
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(140, 130, 118, 0.5)'
        ctx.lineWidth = 0.6
        let first = true
        coast.forEach(([lng, lat]) => {
          const p = project(lng, lat, cx, cy, r, rot)
          if (!p.visible) { first = true; return }
          if (first) { ctx.moveTo(p.x, p.y); first = false }
          else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()

        // Then stipple dots along coastline
        for (let i = 0; i < coast.length - 1; i++) {
          const [lng1, lat1] = coast[i]
          const [lng2, lat2] = coast[i + 1]
          const steps = Math.ceil(Math.hypot(lng2 - lng1, lat2 - lat1) * 2)
          for (let s = 0; s <= steps; s++) {
            const t = s / steps
            const lng = lng1 + (lng2 - lng1) * t
            const lat = lat1 + (lat2 - lat1) * t
            const p = project(lng, lat, cx, cy, r, rot)
            if (!p.visible) continue
            // Vary dot size slightly by depth
            const dotR = 0.8 + p.z * 0.4
            ctx.beginPath()
            ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(120, 110, 98, ${0.4 + p.z * 0.3})`
            ctx.fill()
          }
        }
      })

      // — Draw arcs —
      ARCS.forEach(([i1, i2], arcIdx) => {
        const n1 = NODES[i1]
        const n2 = NODES[i2]
        const arcPoints = getArcPoints(n1, n2, cx, cy, r, rot)

        // Only draw if at least half the arc is visible
        const visibleCount = arcPoints.filter(p => p.visible).length
        if (visibleCount < arcPoints.length * 0.3) return

        // Draw arc line - faint base
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(10, 35, 66, 0.15)'
        ctx.lineWidth = 1
        let first = true
        arcPoints.forEach(p => {
          if (!p.visible) { first = true; return }
          if (first) { ctx.moveTo(p.x, p.y); first = false }
          else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()

        // Animated pulse travelling along arc
        const cycleDuration = 3000 + arcIdx * 700 // stagger cycles
        const cyclePos = ((now + arcIdx * 1100) % cycleDuration) / cycleDuration
        const pulseT = cyclePos
        const pulseIdx = Math.floor(pulseT * arcPoints.length)

        if (pulseIdx < arcPoints.length) {
          const pp = arcPoints[pulseIdx]
          if (pp.visible) {
            // Glowing pulse dot
            const gradient = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, 6)
            gradient.addColorStop(0, 'rgba(10, 35, 66, 0.9)')
            gradient.addColorStop(0.4, 'rgba(10, 35, 66, 0.4)')
            gradient.addColorStop(1, 'rgba(10, 35, 66, 0)')
            ctx.beginPath()
            ctx.arc(pp.x, pp.y, 6, 0, Math.PI * 2)
            ctx.fillStyle = gradient
            ctx.fill()

            // Bright core
            ctx.beginPath()
            ctx.arc(pp.x, pp.y, 2, 0, Math.PI * 2)
            ctx.fillStyle = '#0a2342'
            ctx.fill()
          }
        }
      })

      // — Draw nodes —
      NODES.forEach((node, i) => {
        const p = project(node.lng, node.lat, cx, cy, r, rot)
        if (!p.visible) return

        // Outer ring
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(10, 35, 66, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Inner dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#0a2342'
        ctx.fill()

        // Pulse ring animation
        const pulsePhase = (now / 2000 + i * 0.3) % 1
        const pulseRadius = 5 + pulsePhase * 12
        const pulseOpacity = (1 - pulsePhase) * 0.4
        ctx.beginPath()
        ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(10, 35, 66, ${pulseOpacity})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      })

      ctx.restore()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [size, rotation])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${size}px`, height: `${size}px`, display: 'block' }}
    />
  )
}
