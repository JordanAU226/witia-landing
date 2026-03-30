export const GLOBE_TUNING = {
  radius: 2.06,
  landOffset: 0.012,
  coastOffset: 0.018,
  borderOffset: 0.020,
  graticuleOffset: 0.004,
  atmosphere: {
    innerRadius: 2.12,
    outerRadius: 2.24,
    innerPower: 4.0,
    outerPower: 2.0,
    innerIntensity: 0.14,
    outerIntensity: 0.05,
  },
  routes: {
    tubeRadius: 0.004,
    pulseRadius: 0.016,
    minHeight: 0.10,
    maxHeight: 0.30,
  },
} as const

export const PALETTE = {
  oceanBase: '#b7b1a8',
  landFill: '#9e9a96',
  coastline: '#5d5954',
  borders: '#6f6a64',
  graticule: '#c9c3ba',
  nodeCore: '#26497a',
  routeBody: '#8eaadb',
  routePulse: '#5f89d7',
  atmosphereRim: '#d8e3f2',
} as const

export interface NodeDef {
  id: string
  lat: number
  lng: number
  tier: 1 | 2
}

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

export const ROUTES: string[][] = [
  ['london', 'newyork'],
  ['london', 'lagos'],
  ['london', 'brussels'],
  ['newyork', 'washington'],
  ['newyork', 'singapore'],
  ['lagos', 'nairobi'],
  ['nairobi', 'singapore'],
  ['brussels', 'nairobi'],
  ['london', 'birmingham'],
  ['newyork', 'phoenix'],
]
