export const GLOBE_TUNING = {
  radius: 2.06,
  landOffset: 0.010,
  coastOffset: 0.016,
  borderOffset: 0.018,
  graticuleOffset: 0.003,
  atmosphere: {
    innerRadius: 2.108,  // tight — sits close to limb
    outerRadius: 2.30,   // broad falloff
    innerPower: 6.0,     // very tight fresnel — nearly invisible face-on
    outerPower: 1.6,     // very broad, airy outer halo
    innerIntensity: 0.13,
    outerIntensity: 0.028, // reduced 25% from previous
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
    // Default pose: ~20°E, 10°N — Africa/Europe/Middle East corridor
    defaultRotX: -10 * (Math.PI / 180),
    defaultRotY: -20 * (Math.PI / 180),
    // Constrained sweep: only 40° total yaw from default
    sweepAmplitude: 20 * (Math.PI / 180), // ±20° from default
    sweepPeriod: 45000, // 45s full cycle — slow, composed
    idleDrift: 0.00022, // barely perceptible
    // Pointer response
    pointerYawInfluence: 0.028,
    pointerPitchInfluence: 0.014,
    returnSpeed: 0.035,
  },
} as const

// Smoked stone / ceramic palette — warmer, slightly lighter than previous
export const PALETTE = {
  oceanBase: '#524d48',    // smoked stone — warm charcoal, NOT black
  landFill: '#6e665e',     // clearly lighter — etched/printed feel
  coastline: '#867d72',    // controlled through opacity
  borders: '#7b736a',      // behind coastlines
  graticule: '#8e857b',    // texture and precision, not graphic device
  nodeCore: '#284a78',     // institutional slate blue
  nodeHighlight: '#89a6d3',
  routeBody: '#7f98c2',    // desaturated slate blue
  routePulse: '#6a8fd0',
  atmosphereRim: '#dde4ef', // cool paper-blue, not white
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
