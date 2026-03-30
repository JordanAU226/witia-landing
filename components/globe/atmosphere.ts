import * as THREE from 'three'
import { GLOBE_TUNING, PALETTE } from './tuning'

const vertexShader = /* glsl */`
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

const fragmentShader = /* glsl */`
uniform float uPower;
uniform float uIntensity;
uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), uPower);
  gl_FragColor = vec4(uColor, fresnel * uIntensity);
}
`

function hexToRgb(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

export function buildInnerAtmosphere(tuning: typeof GLOBE_TUNING): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(tuning.atmosphere.innerRadius, 64, 64)
  const color = hexToRgb(PALETTE.atmosphereRim)

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uPower:     { value: tuning.atmosphere.innerPower },
      uIntensity: { value: tuning.atmosphere.innerIntensity },
      uColor:     { value: new THREE.Vector3(color.r, color.g, color.b) },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  return new THREE.Mesh(geometry, material)
}

export function buildOuterHalo(tuning: typeof GLOBE_TUNING): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(tuning.atmosphere.outerRadius, 64, 64)
  const color = hexToRgb(PALETTE.atmosphereRim)

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uPower:     { value: tuning.atmosphere.outerPower },
      uIntensity: { value: tuning.atmosphere.outerIntensity },
      uColor:     { value: new THREE.Vector3(color.r, color.g, color.b) },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  return new THREE.Mesh(geometry, material)
}
