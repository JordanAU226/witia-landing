export const GLOBE_TUNING = {
  radius: 2.06,
  landOffset: 0.012,
  coastOffset: 0.018,
  borderOffset: 0.020,
  graticuleOffset: 0.004,
  atmosphere: {
    innerRadius: 2.10,   // tighter inner shell
    outerRadius: 2.28,   // broader outer halo
    innerPower: 5.2,     // tighter fresnel — less visible front-on
    outerPower: 1.8,     // broader, more diffuse outer halo
    innerIntensity: 0.12,
    outerIntensity: 0.038,
  },
  routes: {
    tubeRadius: 0.0035,
    pulseRadius: 0.014,
    minHeight: 0.10,
    maxHeight: 0.32,
  },
} as const

// Tonal hierarchy: clearly separated values
// Body (darkest) → Land (lighter) → Coastline → Border (softer) → Graticule (faintest)
export const PALETTE = {
  oceanBase: '#9c9690',    // darker base — more tonal separation from land
  landFill: '#c2bdb7',     // noticeably lighter than body — key hierarchy fix
  coastline: '#4a4541',    // strong, crisp geographic line
  borders: '#7a7470',      // recessed, discoverable on inspection
  graticule: '#d4cec8',    // very light, nearly ambient
  nodeCore: '#1e3d6b',     // darker, more precise
  routeBody: '#7ea0d4',    // slightly more visible routes
  routePulse: '#4e7cc9',   // brighter pulse
  atmosphereRim: '#c4d4ee', // cooler, less white
} as const

export interface NodeDef {
  id: string
  lat: number
  lng: number
  tier: 1 | 2
}

// Authored initial pose: Europe/Africa/UK corridor prominent
// Y rotation set so Atlantic faces viewer — shows London, Lagos, Brussels, NY sweep
export const NODES: NodeDef[] = [
  { id: 'london',     lat: 51.5,  lng: -0.1,   tier: 1 },
  { id: 'birmingham', lat: 52.5,  lng: -1.9,   tier: 2 },
  { id: 'brussels',   lat: 50.8,  lng: 4.4,    tier: 2 },
  { id: 'newyork',    lat: 40.7,  lng: -74.0,  tier: 1 },
  { id: 'washington', lat: 38.9,  lng: -77.0,  tier: 2 },
  { id: 'phoenix',    lat: 33.4,  lng: -112.1, tier: 2 },
  { id: 'lagos',      lat: 6.5,   lng: 3.4,    tier: 1 },
  { id: 'nairobi',    lat: -1.3,  lng: 36.8,   tier: 2 },
  { id: 'singapore',  lat: 1.3,   lng: 103.8,  tier: 1 },
]

// Selective routes: 4-5 key routes visible in default pose, not all 10
// Priority: intercontinental intelligence exchange arcs
export const ROUTES: string[][] = [
  ['london', 'newyork'],       // main transatlantic — hero arc
  ['london', 'lagos'],         // UK-Africa — WITIA origin story
  ['london', 'brussels'],      // European institutional
  ['newyork', 'singapore'],    // global east-west
  ['lagos', 'nairobi'],        // African corridor
  ['brussels', 'nairobi'],     // EU-Africa intelligence
  ['london', 'birmingham'],    // UK pilot
  ['newyork', 'phoenix'],      // US expansion
]
