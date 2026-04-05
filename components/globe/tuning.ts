export const GLOBE_TUNING = {
  radius: 2.06,
  landOffset: 0.015,  // raised — matches brief's R + 0.012 and prevents z-fighting
  coastOffset: 0.016,
  borderOffset: 0.018,
  graticuleOffset: 0.003,
  atmosphere: {
    innerRadius: 2.105,  // tighter still — closer to limb
    outerRadius: 2.26,   // reduced outer radius — less broad wash
    innerPower: 6.8,     // even tighter fresnel — really only at edge
    outerPower: 1.4,     // broad falloff but weaker
    innerIntensity: 0.11,
    outerIntensity: 0.020, // significantly reduced outer wash
  },
  routes: {
    tubeRadius: 0.0030,  // ~1.5px at hero scale
    pulseRadius: 0.012,
    minHeight: 0.12,
    maxHeight: 0.34,
  },
  // Constrained hero orbit — not full 360°
  // Globe dwells on Africa/Europe, sweeps toward Americas, returns
  motion: {
    // Default pose: Africa/Europe/Middle East canonical frame
    defaultRotX: -0.165,
    defaultRotY: 0.345,
    // Constrained sweep: ±18° — very small range, strong dwell
    sweepAmplitude: 18 * (Math.PI / 180),
    sweepPeriod: 62000,  // 62s cycle — viewer feels authorship, not animation
    // Asymmetric dwell: globe spends 65% of time near default pose
    dwellBias: 0.65,
    idleDrift: 0.00015,  // barely perceptible base drift
    // Pointer: museum object — 2-4° yaw, 1-2° pitch
    pointerYawInfluence: 0.022,
    pointerPitchInfluence: 0.010,
    returnSpeed: 0.028,   // graceful return over ~700ms
  },
} as const

export const PALETTE = {
  oceanBase: '#312b27',
  landFill: '#6c645b',
  coastline: '#948a7f',
  borders: '#776f67',
  graticule: '#5f5851',
  nodeCore: '#315f98',
  nodeHighlight: '#8daddc',
  routeBody: '#809bc7',
  routePulse: '#6d90d6',
  atmosphereRim: '#dfe6f0',
} as const

// Node tier hierarchy
export const NODE_VISUAL_TIER = {
  london: 'primary',
  brussels: 'secondary',
  lagos: 'secondary',
  'new-york': 'secondary',
  nairobi: 'tertiary',
  washington: 'tertiary',
  singapore: 'tertiary',
  birmingham: 'ambient',
  phoenix: 'ambient',
} as const

export type NodeTier = 'primary' | 'secondary' | 'tertiary' | 'ambient'

export const NODE_STYLE = {
  primary:   { core: 0.032, glow: 0.068, hi: 0.010, baseGlow: 0.10 },
  secondary: { core: 0.026, glow: 0.054, hi: 0.008, baseGlow: 0.075 },
  tertiary:  { core: 0.021, glow: 0.044, hi: 0.006, baseGlow: 0.05 },
  ambient:   { core: 0.016, glow: 0.034, hi: 0.004, baseGlow: 0.03 },
} as const

export const NODE_COLORS = {
  core: '#315f98',
  glow: '#8eaddc',
  highlight: '#c8d8ef',
}

export interface NodeDef {
  id: string
  lat: number
  lng: number
  tier: NodeTier
}

export const NODES: NodeDef[] = [
  { id: 'london',     lat: 51.5,  lng: -0.1,   tier: 'primary' },
  { id: 'brussels',   lat: 50.8,  lng: 4.4,    tier: 'secondary' },
  { id: 'lagos',      lat: 6.5,   lng: 3.4,    tier: 'secondary' },
  { id: 'new-york',   lat: 40.7,  lng: -74.0,  tier: 'secondary' },
  { id: 'nairobi',    lat: -1.3,  lng: 36.8,   tier: 'tertiary' },
  { id: 'washington', lat: 38.9,  lng: -77.0,  tier: 'tertiary' },
  { id: 'singapore',  lat: 1.3,   lng: 103.8,  tier: 'tertiary' },
  { id: 'birmingham', lat: 52.5,  lng: -1.9,   tier: 'ambient' },
  { id: 'phoenix',    lat: 33.4,  lng: -112.1, tier: 'ambient' },
]

// Routes: transatlantic is the signature hero arc
// Only 1-2 readable at once — hero arc + 1 supporting
export const ROUTES: string[][] = [
  ['london', 'new-york'],   // HERO ARC — transatlantic, visible in default pose
  ['london', 'lagos'],      // supporting — UK-Africa, origin story
  ['brussels', 'nairobi'],  // EU-Africa corridor
  ['london', 'brussels'],   // European institutional
  ['new-york', 'washington'],
  ['lagos', 'nairobi'],
  ['new-york', 'singapore'],
  ['london', 'birmingham'],
]
