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
    defaultRotX: -10 * (Math.PI / 180),
    defaultRotY: -20 * (Math.PI / 180),
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
  oceanBase: '#5e5850',    // warm stone ocean
  landFill: '#a09890',     // land clearly lighter
  coastline: '#7a7068',    // coastline leads — readable first
  borders: '#7b736a',      // behind coastlines
  graticule: '#8e857b',    // texture only
  nodeCore: '#284a78',     // institutional slate blue
  nodeHighlight: '#89a6d3',
  routeBody: '#8aa0c8',    // slightly raised route body for spatial identity
  routePulse: '#6a8fd0',
  atmosphereRim: '#ced9ed', // cooler, less white
} as const

export interface NodeDef {
  id: string
  lat: number
  lng: number
  tier: 1 | 2 | 3
}

export const NODES: NodeDef[] = [
  // Tier 1 — primary hubs (Europe cluster is the hero focal point)
  { id: 'london',     lat: 51.5,  lng: -0.1,   tier: 1 },
  { id: 'lagos',      lat: 6.5,   lng: 3.4,    tier: 1 },
  { id: 'newyork',    lat: 40.7,  lng: -74.0,  tier: 1 },
  { id: 'singapore',  lat: 1.3,   lng: 103.8,  tier: 1 },
  // Tier 2 — meaningful secondary anchors
  { id: 'brussels',   lat: 50.8,  lng: 4.4,    tier: 2 },
  { id: 'nairobi',    lat: -1.3,  lng: 36.8,   tier: 2 },
  { id: 'washington', lat: 38.9,  lng: -77.0,  tier: 2 },
  // Tier 3 — present but quieter
  { id: 'birmingham', lat: 52.5,  lng: -1.9,   tier: 3 },
  { id: 'phoenix',    lat: 33.4,  lng: -112.1, tier: 3 },
]

// Routes: transatlantic is the signature hero arc
// Only 1-2 readable at once — hero arc + 1 supporting
export const ROUTES: string[][] = [
  ['london', 'newyork'],    // HERO ARC — transatlantic, visible in default pose
  ['london', 'lagos'],      // supporting — UK-Africa, origin story
  ['brussels', 'nairobi'],  // EU-Africa corridor
  ['london', 'brussels'],   // European institutional
  ['newyork', 'washington'],
  ['lagos', 'nairobi'],
  ['newyork', 'singapore'],
  ['london', 'birmingham'],
]
