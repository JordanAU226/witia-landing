'use client'
import { useEffect, useRef } from 'react'

// Simplified but accurate country polygon coordinates [lng, lat]
const CONTINENTS = {
  northAmerica: [
    [-168,72],[-140,70],[-130,65],[-120,75],[-100,73],[-85,75],[-65,68],
    [-55,50],[-60,45],[-75,46],[-80,44],[-83,42],[-82,42],[-80,35],
    [-81,30],[-95,29],[-97,26],[-90,25],[-87,22],[-92,18],[-87,15],
    [-83,10],[-77,8],[-80,12],[-77,15],[-88,20],[-90,16],[-94,18],
    [-103,22],[-109,23],[-112,28],[-117,30],[-120,34],[-124,38],
    [-124,48],[-130,55],[-140,58],[-145,60],[-155,60],[-165,65],[-168,72]
  ],
  southAmerica: [
    [-80,12],[-75,10],[-65,10],[-60,8],[-50,2],[-40,2],[-35,-5],
    [-35,-10],[-38,-15],[-40,-22],[-45,-28],[-52,-33],[-58,-38],
    [-65,-42],[-65,-52],[-68,-54],[-72,-50],[-72,-42],[-68,-30],
    [-70,-20],[-75,-14],[-80,-2],[-78,5],[-80,12]
  ],
  europe: [
    [-10,36],[0,36],[5,36],[15,38],[18,40],[28,42],[30,46],[24,55],
    [20,58],[15,58],[10,58],[5,58],[0,58],[-5,58],[-8,56],[-15,56],
    [-10,52],[-8,48],[-5,44],[0,44],[5,43],[8,40],[15,38],[10,36],[-10,36]
  ],
  africa: [
    [-18,16],[-15,20],[-10,22],[0,18],[5,15],[10,15],[15,18],[20,20],
    [25,22],[32,22],[38,18],[42,15],[44,12],[43,5],[42,-2],[40,-8],
    [38,-12],[36,-18],[32,-25],[28,-34],[24,-34],[18,-35],[15,-30],
    [12,-22],[8,-15],[2,-8],[-2,2],[-5,5],[-15,8],[-18,16]
  ],
  asia: [
    [28,42],[35,38],[40,36],[48,38],[55,42],[60,40],[68,38],[75,36],
    [80,32],[85,28],[90,25],[95,22],[100,18],[105,12],[108,8],[110,4],
    [115,2],[120,4],[122,8],[125,12],[128,18],[130,25],[132,32],
    [138,38],[140,42],[142,46],[140,50],[132,52],[125,52],[118,55],
    [110,58],[100,60],[90,65],[80,70],[70,72],[60,72],[48,68],[40,65],
    [35,62],[30,58],[28,52],[25,48],[28,44],[28,42]
  ],
  australia: [
    [114,-22],[118,-20],[122,-18],[128,-16],[132,-14],[136,-14],
    [138,-16],[140,-18],[144,-18],[148,-20],[152,-24],[154,-28],
    [152,-32],[150,-38],[146,-40],[140,-38],[136,-36],[130,-34],
    [124,-34],[118,-32],[114,-28],[114,-22]
  ],
  greenland: [
    [-45,84],[-20,82],[-15,78],[-20,72],[-28,68],[-40,65],[-52,65],
    [-58,68],[-55,72],[-48,76],[-45,80],[-45,84]
  ]
}

// Active jurisdictions for WITIA — filled with dense navy dots
const ACTIVE_COUNTRIES = {
  uk: [
    [-5,50],[0,50],[2,52],[1,54],[0,56],[-2,58],[-4,58],[-5,56],
    [-3,54],[-4,52],[-5,50]
  ],
  nigeria: [
    [3,6],[4,5],[5,4],[7,4],[9,4],[10,6],[12,8],[14,10],[14,12],
    [13,14],[12,14],[10,13],[8,12],[5,10],[3,8],[3,6]
  ],
  usa: [
    [-125,48],[-116,48],[-104,48],[-97,48],[-88,48],[-83,46],
    [-80,44],[-76,44],[-72,44],[-67,44],[-67,42],[-70,42],
    [-75,38],[-76,34],[-78,30],[-85,30],[-90,28],[-97,26],
    [-100,28],[-108,30],[-115,32],[-120,34],[-124,38],[-124,48],[-125,48]
  ]
}

function project(lng: number, lat: number, cx: number, cy: number, r: number, rotY: number) {
  const lngRad = (lng + rotY) * Math.PI / 180
  const latRad = lat * Math.PI / 180

  const x = r * Math.cos(latRad) * Math.sin(lngRad)
  const y = -r * Math.sin(latRad)
  const z = r * Math.cos(latRad) * Math.cos(lngRad)

  if (z < -0.1) return null

  return { x: cx + x, y: cy + y, visible: z > 0 }
}

function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

interface GlobeIllustrationProps {
  size?: number
  rotation?: number
}

export default function GlobeIllustration({ size = 480, rotation = -30 }: GlobeIllustrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const rotRef = useRef(rotation)

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
    const r = size * 0.44

    let lastTime = 0

    function draw(time: number) {
      const dt = time - lastTime
      lastTime = time
      rotRef.current += dt * 0.008

      ctx.clearRect(0, 0, size, size)

      const rot = rotRef.current

      // Globe circle outline
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = '#C8C4BE'
      ctx.lineWidth = 1
      ctx.stroke()

      // Clip to globe circle
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()

      // Ocean background
      ctx.fillStyle = '#FAFAF8'
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)

      // Graticule lines
      ctx.strokeStyle = 'rgba(180, 172, 162, 0.4)'
      ctx.lineWidth = 0.5

      // Latitude lines
      for (let lat = -75; lat <= 75; lat += 15) {
        ctx.beginPath()
        let first = true
        for (let lng = -180; lng <= 180; lng += 2) {
          const p = project(lng, lat, cx, cy, r, rot)
          if (!p || !p.visible) { first = true; continue }
          if (first) { ctx.moveTo(p.x, p.y); first = false }
          else ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
      }

      // Longitude lines
      for (let lng = -165; lng <= 180; lng += 15) {
        ctx.beginPath()
        let first = true
        for (let lat = -90; lat <= 90; lat += 2) {
          const p = project(lng, lat, cx, cy, r, rot)
          if (!p || !p.visible) { first = true; continue }
          if (first) { ctx.moveTo(p.x, p.y); first = false }
          else ctx.lineTo(p.x, p.y)
        }
        ctx.stroke()
      }

      const allContinents = Object.values(CONTINENTS)

      // Continent outlines
      ctx.strokeStyle = 'rgba(140, 132, 122, 0.7)'
      ctx.lineWidth = 0.8

      allContinents.forEach(polygon => {
        ctx.beginPath()
        let first = true
        polygon.forEach(([lng, lat]) => {
          const p = project(lng, lat, cx, cy, r, rot)
          if (!p) { first = true; return }
          if (first) { ctx.moveTo(p.x, p.y); first = false }
          else ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()
        ctx.stroke()
      })

      // Stipple dots on land
      const dotSpacing = 6
      for (let lat = -80; lat <= 80; lat += dotSpacing * 0.8) {
        for (let lng = -180; lng <= 180; lng += dotSpacing) {
          const lngLat: [number, number] = [lng, lat]
          const onContinent = allContinents.some(poly => isPointInPolygon(lngLat, poly))
          if (!onContinent) continue

          const isActive = Object.values(ACTIVE_COUNTRIES).some(poly => isPointInPolygon(lngLat, poly))

          const p = project(lng, lat, cx, cy, r, rot)
          if (!p || !p.visible) continue

          if (isActive) {
            ctx.beginPath()
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(10, 35, 66, 0.85)'
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(140, 132, 122, 0.5)'
            ctx.fill()
          }
        }
      }

      // Active city markers
      const activeCities = [
        { lng: -0.1, lat: 51.5, label: 'London' },
        { lng: 3.4, lat: 6.5, label: 'Lagos' },
        { lng: -77.0, lat: 38.9, label: 'Washington' },
        { lng: -1.9, lat: 52.5, label: 'Birmingham' },
      ]

      activeCities.forEach(city => {
        const p = project(city.lng, city.lat, cx, cy, r, rot)
        if (!p || !p.visible) return
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#0a2342'
        ctx.fill()
      })

      ctx.restore()

      // Vignette
      const grad = ctx.createRadialGradient(cx, cy + r * 0.3, r * 0.6, cx, cy, r)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(245, 244, 242, 0.25)')
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = grad
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
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
