import * as THREE from 'three'
import { GLOBE_TUNING } from './tuning'

export function toSphere(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  )
}

export function greatCircleDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const toRad = (d: number) => d * (Math.PI / 180)
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  // Normalise by max great-circle distance (π)
  return c / Math.PI
}

export function arcLift(dist: number, tuning: typeof GLOBE_TUNING): number {
  const { minHeight, maxHeight } = tuning.routes
  return minHeight + (maxHeight - minHeight) * Math.min(dist, 1)
}

/**
 * Antimeridian fix: if consecutive points span more than 180° in longitude,
 * shift them to keep the ring on one side.
 */
export function preprocessRing(coords: number[][]): number[][] {
  if (coords.length === 0) return coords
  const result: number[][] = [coords[0].slice()]
  for (let i = 1; i < coords.length; i++) {
    const prev = result[i - 1]
    const curr = coords[i].slice()
    let dLng = curr[0] - prev[0]
    if (dLng > 180) curr[0] -= 360
    else if (dLng < -180) curr[0] += 360
    result.push(curr)
  }
  return result
}
