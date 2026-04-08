'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'

const PANEL_BG = "#0d0d0f"
const STONE_SOFT = "rgba(191, 179, 164, 0.14)"
const TEXT_LABEL = "rgba(136, 136, 140, 0.92)"
const TEXT_MONO = "rgba(222, 222, 226, 0.96)"
const TEXT_BODY = "rgba(206, 206, 212, 0.72)"
const BLUE = "rgba(173, 214, 255, 0.95)"
const NAVY = "rgba(56, 83, 141, 0.95)"
const RED = "rgba(220, 90, 90, 0.95)"

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
function easeInOut(t: number) {
  const x = clamp(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
function band(progress: number, start: number, end: number) {
  if (progress <= start) return 0
  if (progress >= end) return 1
  return easeInOut((progress - start) / (end - start))
}
function fade(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start))
}

function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const next = total <= 0 ? 0 : clamp(-rect.top / total, 0, 1)
      setProgress(next)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ref])
  return progress
}

type TextAnchor = 'start' | 'middle' | 'end'

function TinyLabel({ x, y, children, opacity = 1, anchor = 'start' }: {
  x: number; y: number; children: React.ReactNode; opacity?: number; anchor?: TextAnchor
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize="9" letterSpacing="2.8" fill={TEXT_LABEL} opacity={opacity}
      style={{ textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {children}
    </text>
  )
}

function MonoText({ x, y, children, opacity = 1, anchor = 'start', size = 13, fill = TEXT_MONO }: {
  x: number; y: number; children: React.ReactNode; opacity?: number; anchor?: TextAnchor; size?: number; fill?: string
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill} opacity={opacity}
      style={{ fontFamily: '"SFMono-Regular", ui-monospace, Menlo, monospace' }}>
      {children}
    </text>
  )
}

function SerifText({ x, y, children, opacity = 1, anchor = 'start', size = 24 }: {
  x: number; y: number; children: React.ReactNode; opacity?: number; anchor?: TextAnchor; size?: number
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill="white" opacity={opacity}
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
      {children}
    </text>
  )
}

function ScoreRow({ x, y, label, value, highlight, progress }: {
  x: number; y: number; label: string; value: number; highlight: boolean; progress: number
}) {
  const fillCount = Math.round((value / 100) * 8)
  const local = band(progress, 0.42, 0.66)
  const countUp = Math.round(value * local)
  const pulse = highlight ? 0.72 + Math.sin(progress * 42) * 0.28 : 1
  return (
    <g opacity={local} transform={`translate(${x} ${y})`}>
      <TinyLabel x={0} y={0} opacity={0.96}>{label}</TinyLabel>
      <g transform="translate(0 16)">
        {Array.from({ length: 8 }).map((_, index) => (
          <rect key={index} x={index * 18} y={0} width={14} height={8} rx={2}
            fill={index < fillCount ? (highlight ? `rgba(220,90,90,${0.42 * pulse})` : 'rgba(186,213,255,0.72)') : 'rgba(255,255,255,0.12)'}
            stroke={index < fillCount ? 'none' : 'rgba(255,255,255,0.05)'} />
        ))}
      </g>
      <MonoText x={162} y={24} opacity={0.96} size={13}>{String(countUp).padStart(2, '0')}</MonoText>
      {highlight ? <MonoText x={198} y={24} opacity={0.86} size={13} fill={RED}>← anomaly</MonoText> : null}
    </g>
  )
}

function VendorGraph({ progress }: { progress: number }) {
  const visible = band(progress, 0.16, 0.32) * (1 - band(progress, 0.34, 0.42))
  const nodes: [number, number][] = [[238, 492], [278, 458], [292, 516], [328, 476], [354, 430], [366, 508], [398, 466]]
  const edges: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [5, 6], [4, 6]]
  return (
    <g opacity={visible}>
      {edges.map(([a, b], index) => (
        <line key={index} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="rgba(150,197,255,0.44)" strokeWidth="1.2" />
      ))}
      {nodes.map(([nx, ny], index) => (
        <g key={index}>
          <circle cx={nx} cy={ny} r={12 + Math.sin(progress * 24 + index) * 1.5} fill="rgba(118,170,255,0.08)" />
          <circle cx={nx} cy={ny} r="4" fill="rgba(214,232,255,0.95)" />
        </g>
      ))}
    </g>
  )
}

function ArchitectureScene({ progress }: { progress: number }) {
  const cx = 760
  const cy = 360
  const outerR = 280
  const midR = 190
  const innerR = 102

  const section1 = band(progress, 0.0, 0.33)
  const section2 = band(progress, 0.33, 0.66)
  const section3 = band(progress, 0.66, 1.0)

  const y1 = lerp(42, cy - outerR + 2, section1)
  const y2 = lerp(cy - outerR + 2, cy - midR + 2, section2)
  const y3 = lerp(cy - midR + 2, cy, section3)
  const transactionY = progress < 0.33 ? y1 : progress < 0.66 ? y2 : y3

  const haloColor = progress < 0.33 ? 'rgba(173,214,255,0.7)' : progress < 0.66 ? 'rgba(231,173,87,0.78)' : 'rgba(220,90,90,0.78)'
  const anomalyScore = Math.round(lerp(0, 87, band(progress, 0.12, 0.26)))
  const compositeScore = Math.round(lerp(0, 41, band(progress, 0.46, 0.62)))
  const distributedCount = Math.round(lerp(0, 4, band(progress, 0.76, 0.9)))
  const outerPulse = band(progress, 0.14, 0.22) * (1 - band(progress, 0.24, 0.3))
  const middlePulse = band(progress, 0.44, 0.52) * (1 - band(progress, 0.54, 0.6))
  const innerPulse = band(progress, 0.74, 0.82) * (1 - band(progress, 0.84, 0.9))
  const zoomOut = band(progress, 0.74, 1)
  const scale = 1 - zoomOut * 0.06
  const translateY = zoomOut * 16

  const backgroundTransactions = useMemo(() => {
    const dots: { x: number; y: number; r: number; o: number }[] = []
    let seed = 19
    const rand = () => {
      seed += 0x6d2b79f5
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    for (let i = 0; i < 78; i++) {
      dots.push({ x: 120 + rand() * 1160, y: 80 + rand() * 680, r: 1 + rand() * 2.4, o: 0.08 + rand() * 0.16 })
    }
    return dots
  }, [])

  const jurisdictions = [
    { label: 'BIRMINGHAM', x: 534, y: 112, delay: 0.78 },
    { label: 'BRUSSELS', x: 972, y: 124, delay: 0.82 },
    { label: 'NAIROBI', x: 1036, y: 552, delay: 0.86 },
    { label: 'MARICOPA COUNTY', x: 432, y: 560, delay: 0.9 },
  ]

  const secondTransactionVisible = band(progress, 0.9, 1)
  const secondY = lerp(36, cy - outerR - 24, secondTransactionVisible)

  return (
    <svg viewBox="0 0 1400 900" className="h-full w-full">
      <defs>
        <radialGradient id="mainGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(120,177,255,0.95)" />
          <stop offset="44%" stopColor="rgba(120,177,255,0.28)" />
          <stop offset="100%" stopColor="rgba(120,177,255,0)" />
        </radialGradient>
        <radialGradient id="amberGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(231,173,87,0.95)" />
          <stop offset="48%" stopColor="rgba(231,173,87,0.28)" />
          <stop offset="100%" stopColor="rgba(231,173,87,0)" />
        </radialGradient>
        <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(220,90,90,0.95)" />
          <stop offset="48%" stopColor="rgba(220,90,90,0.28)" />
          <stop offset="100%" stopColor="rgba(220,90,90,0)" />
        </radialGradient>
        <filter id="blur16" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <rect width="1400" height="900" fill={PANEL_BG} />

      {/* Background grid */}
      <g opacity="0.7">
        <circle cx="760" cy="360" r="380" fill="none" stroke={STONE_SOFT} strokeWidth="1" />
        <circle cx="760" cy="360" r="334" fill="none" stroke="rgba(173,214,255,0.04)" strokeWidth="1" />
        <line x1="760" y1="34" x2="760" y2="820" stroke="rgba(209,201,189,0.09)" strokeWidth="1" />
        <line x1="386" y1="360" x2="1134" y2="360" stroke="rgba(209,201,189,0.06)" strokeWidth="1" />
        {Array.from({ length: 12 }).map((_, i) => (
          <circle key={i} cx="760" cy="360" r={80 + i * 26} fill="none" stroke="rgba(191,179,164,0.028)" strokeWidth="1" />
        ))}
      </g>

      {/* Background transaction dots */}
      {backgroundTransactions.map((dot, index) => (
        <circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill="rgba(181,181,188,1)" opacity={dot.o} />
      ))}

      {/* Scroll labels */}
      <TinyLabel x={110} y={84} opacity={0.86}>WITIA — THE LIVING TRANSACTION FLOW</TinyLabel>
      <TinyLabel x={1230} y={84} opacity={0.72} anchor="end">SCROLL TO ADVANCE</TinyLabel>

      {/* Main architecture group */}
      <g transform={`translate(0 ${translateY}) scale(${scale}) translate(${cx - cx * scale} ${cy - cy * scale})`}>
        {/* Ring bases */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(193,219,255,0.16)" strokeWidth="1.4" />
        <circle cx={cx} cy={cy} r={midR} fill="none" stroke="rgba(122,154,214,0.18)" strokeWidth="1.2" />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(205,222,255,0.2)" strokeWidth="1.2" />

        {/* Animated ring fills */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={BLUE} strokeWidth="2.2" opacity={0.78}
          strokeDasharray={`${880 * band(progress, 0.08, 0.32)} 9999`} strokeLinecap="round"
          transform={`rotate(-92 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={midR} fill="none" stroke={NAVY} strokeWidth="2.2" opacity={0.8}
          strokeDasharray={`${600 * band(progress, 0.36, 0.66)} 9999`} strokeLinecap="round"
          transform={`rotate(-92 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(210,228,255,0.95)" strokeWidth="2.2" opacity={0.92}
          strokeDasharray={`${320 * band(progress, 0.72, 1)} 9999`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />

        {/* Ring pulse glows */}
        <circle cx={cx} cy={cy - outerR} r={18 + outerPulse * 32} fill="rgba(173,214,255,0.05)" opacity={outerPulse} />
        <circle cx={cx} cy={cy - midR} r={18 + middlePulse * 30} fill="rgba(63,92,162,0.08)" opacity={middlePulse} />
        <circle cx={cx} cy={cy - innerR} r={16 + innerPulse * 28} fill="rgba(215,230,255,0.08)" opacity={innerPulse} />

        {/* Dashed path guides */}
        <path d={`M ${cx} 42 L ${cx} ${cy - outerR}`} fill="none" stroke="rgba(173,214,255,0.24)" strokeWidth="1.4"
          strokeDasharray="3 8" opacity={band(progress, 0.02, 0.24)} />
        <path d={`M ${cx} ${cy - outerR} L ${cx} ${cy - midR}`} fill="none" stroke="rgba(231,173,87,0.24)" strokeWidth="1.4"
          strokeDasharray="3 8" opacity={band(progress, 0.28, 0.56)} />
        <path d={`M ${cx} ${cy - midR} L ${cx} ${cy}`} fill="none" stroke="rgba(220,90,90,0.24)" strokeWidth="1.4"
          strokeDasharray="3 8" opacity={band(progress, 0.58, 0.94)} />

        {/* Propagation rings for section 3 */}
        {Array.from({ length: 3 }).map((_, i) => {
          const local = clamp((section3 - i * 0.16) / 0.44)
          return (
            <circle key={i} cx={cx} cy={cy}
              r={innerR + local * (220 + i * 48)}
              fill="none" stroke="rgba(186,218,255,0.16)"
              strokeWidth="1.2" opacity={(1 - local) * section3} />
          )
        })}

        {/* Jurisdiction nodes with curved paths */}
        <g opacity={section3}>
          {jurisdictions.map((node) => {
            const visible = band(progress, node.delay, 1)
            return (
              <g key={node.label} opacity={visible}>
                <path d={`M ${cx} ${cy} Q ${lerp(cx, node.x, 0.5)} ${lerp(cy, node.y, 0.5) - 36} ${node.x} ${node.y}`}
                  fill="none" stroke="rgba(120,177,255,0.22)" strokeWidth="1.3" />
                <circle cx={node.x} cy={node.y} r={14 + visible * 10} fill="rgba(118,170,255,0.08)" />
                <circle cx={node.x} cy={node.y} r="4.5" fill="rgba(228,238,255,0.98)" />
                <TinyLabel x={node.x} y={node.y - 18} opacity={visible} anchor="middle">{node.label}</TinyLabel>
              </g>
            )
          })}
        </g>

        {/* Main transaction node */}
        <g transform={`translate(${cx} ${transactionY})`}>
          <circle r="42" fill={progress < 0.33 ? "url(#mainGlow)" : progress < 0.66 ? "url(#amberGlow)" : "url(#redGlow)"} opacity="0.92" filter="url(#blur16)" />
          <circle r="13" fill="rgba(11,29,58,0.98)" />
          <circle r="5.5" fill="rgba(239,246,255,0.98)" />
          <circle r="22" fill="none" stroke={haloColor} strokeWidth="1.6" opacity={0.72} />
        </g>

        {/* Second transaction (pre-flagged) */}
        {secondTransactionVisible > 0 && (
          <g opacity={secondTransactionVisible} transform={`translate(${cx} ${secondY})`}>
            <circle r="34" fill="url(#redGlow)" opacity="0.9" filter="url(#blur16)" />
            <circle r="11" fill="rgba(91,19,19,0.98)" />
            <circle r="4.5" fill="rgba(255,239,239,0.98)" />
            <circle r="24" fill="none" stroke={RED} strokeWidth="1.4" opacity="0.9" />
          </g>
        )}

        {/* Center label */}
        <SerifText x={cx} y={cy + 6} anchor="middle" opacity={band(progress, 0.72, 0.86)} size={18}>WITIA</SerifText>
        <TinyLabel x={cx} y={cy + 24} anchor="middle" opacity={band(progress, 0.76, 0.9)}>INTELLIGENCE EXCHANGE</TinyLabel>
      </g>

      {/* ── SECTION 1: Detection panel ─────────────────────────── */}
      <g opacity={fade(progress, 0.04, 0.12) * (1 - fade(progress, 0.34, 0.44))}>
        <TinyLabel x={110} y={182}>01 — FRAUD DETECTION</TinyLabel>
        <SerifText x={110} y={222}>The transaction enters the system.</SerifText>
        <MonoText x={110} y={264}>Ensemble AI across five models.</MonoText>
        <MonoText x={110} y={288}>Anomaly score: 0.{String(anomalyScore).padStart(2, "0")} ⚠️</MonoText>
        <MonoText x={110} y={312}>Invoice splitting pattern detected.</MonoText>
        <MonoText x={110} y={336}>Shell company network — 3 tiers deep.</MonoText>
        <MonoText x={110} y={378} fill={TEXT_BODY}>False positive rate: 2.1%</MonoText>
        <TinyLabel x={110} y={438}>INVOICE #4471 · £2.4M · VENDOR: APEX SOLUTIONS LTD</TinyLabel>
        <VendorGraph progress={progress} />
      </g>

      {/* ── SECTION 2: Trust Scoring panel (right side) ──────────── */}
      <g opacity={fade(progress, 0.38, 0.48) * (1 - fade(progress, 0.74, 0.84))}>
        <TinyLabel x={1020} y={182}>02 — TRUST SCORING</TinyLabel>
        <SerifText x={1020} y={222}>The vendor profile resolves in real time.</SerifText>
        <TinyLabel x={1020} y={268}>VENDOR TRUST SCORE — APEX SOLUTIONS LTD</TinyLabel>
        <ScoreRow x={1020} y={306} label="Identity Integrity" value={42} highlight={false} progress={progress} />
        <ScoreRow x={1020} y={352} label="Delivery Performance" value={61} highlight={false} progress={progress} />
        <ScoreRow x={1020} y={398} label="Financial Behaviour" value={28} highlight={true} progress={progress} />
        <ScoreRow x={1020} y={444} label="Competitive Conduct" value={34} highlight={true} progress={progress} />
        <ScoreRow x={1020} y={490} label="Relationship Risk" value={55} highlight={false} progress={progress} />
        <ScoreRow x={1020} y={536} label="Compliance Transparency" value={31} highlight={true} progress={progress} />
        <MonoText x={1020} y={604}>COMPOSITE SCORE: {String(compositeScore).padStart(2, "0")} / 100 ↓ DECLINING</MonoText>
        <line x1="1020" y1="626" x2="1268" y2="626" stroke="rgba(255,255,255,0.08)" />
        <line x1="1144" y1="620" x2="1144" y2="632" stroke="rgba(220,90,90,0.66)" />
        <MonoText x={1020} y={662} fill={TEXT_BODY}>EXPEDITED PAYMENT: SUSPENDED · AUDIT PROBABILITY: ELEVATED</MonoText>
      </g>

      {/* ── SECTION 3: Exchange panel (center bottom) ─────────────── */}
      <g opacity={fade(progress, 0.72, 0.82)}>
        <TinyLabel x={760} y={618} anchor="middle">03 — INTELLIGENCE EXCHANGE</TinyLabel>
        <SerifText x={760} y={656} anchor="middle">Pattern catalogued.</SerifText>
        <MonoText x={760} y={694} anchor="middle">Vendor fingerprint distributed to {distributedCount} jurisdictions.</MonoText>
        <MonoText x={760} y={730} anchor="middle">APEX SOLUTIONS LTD is now flagged in every connected system.</MonoText>
        <MonoText x={760} y={766} anchor="middle" fill={TEXT_BODY}>Next time: flagged before first contact.</MonoText>
      </g>

      {/* Second transaction label */}
      <g opacity={secondTransactionVisible}>
        <TinyLabel x={760} y={120} anchor="middle">SECOND TRANSACTION — SAME VENDOR</TinyLabel>
        <MonoText x={760} y={144} anchor="middle" fill={RED}>PRE-FLAGGED BEFORE FIRST RING</MonoText>
      </g>

      {/* Initial transaction label */}
      <g opacity={band(progress, 0.02, 0.14)}>
        <MonoText x={cx + 16} y={48} size={10} fill="rgba(200,220,255,0.9)">INVOICE #4471 · £2.4M</MonoText>
        <MonoText x={cx + 16} y={62} size={10} fill="rgba(200,220,255,0.72)">VENDOR: APEX SOLUTIONS LTD</MonoText>
      </g>

      {/* Progress bar */}
      <g opacity={0.9}>
        <TinyLabel x={74} y={846}>0%</TinyLabel>
        <line x1="112" y1="842" x2="1288" y2="842" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="112" y1="842" x2={112 + 1176 * progress} y2="842" stroke="rgba(174,213,255,0.52)" strokeWidth="1.5" />
        <TinyLabel x={1316} y={846} anchor="end">100%</TinyLabel>
      </g>
    </svg>
  )
}

export default function TransactionFlow() {
  const containerRef = useRef<HTMLDivElement>(null)
  const progress = useScrollProgress(containerRef)

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <div ref={containerRef} className="relative h-[600vh] bg-[#07080b]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(124,173,255,0.08),transparent_26%),radial-gradient(circle_at_50%_54%,rgba(196,180,156,0.08),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_18%)]" />
          <ArchitectureScene progress={progress} />
        </div>
      </div>
    </div>
  )
}
