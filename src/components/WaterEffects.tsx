import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export function WaterEffects({ paused }: { paused: boolean }) {
  return (
    <group>
      <WaterSurface paused={paused} />
      <CausticField paused={paused} />
    </group>
  );
}

function WaterSurface({ paused }: { paused: boolean }) {
  const material = useWaterSurfaceMaterial();

  useFrame((_, delta) => {
    if (!paused) material.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={[0, 11.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={material} renderOrder={4}>
      <circleGeometry args={[31, 128]} />
    </mesh>
  );
}

function CausticField({ paused }: { paused: boolean }) {
  const material = useAnimatedWaterMaterial({
    color: '#bff7ff',
    opacity: 0.055,
    depthTest: true,
  });

  useFrame((_, delta) => {
    if (paused) return;
    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={[0, -7.96, 0]} rotation={[Math.PI / 2, 0, 0]} material={material} renderOrder={2}>
      <circleGeometry args={[29, 160]} />
    </mesh>
  );
}

function useAnimatedWaterMaterial({
  color,
  depthTest,
  opacity,
}: {
  color: string;
  depthTest: boolean;
  opacity: number;
}) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vWorldPosition;

          void main() {
            vUv = uv;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vWorldPosition;

          float linePattern(vec2 p, float speed, float angle) {
            mat2 r = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
            vec2 q = r * p;
            float wave = sin(q.x * 12.0 + sin(q.y * 3.0 + uTime * speed) * 1.8 + uTime * speed);
            return smoothstep(0.87, 1.0, wave);
          }

          void main() {
            vec2 p = (vUv - 0.5) * 2.0;
            float radial = length(p);
            float edgeFade = 1.0 - smoothstep(0.36, 0.92, radial);
            vec2 worldish = vWorldPosition.xz * 0.16;
            float caustic =
              linePattern(worldish, 0.36, 0.35) *
              linePattern(worldish * 1.13 + 3.2, -0.22, -0.72);
            float secondary = linePattern(worldish * 0.76 - 1.1, 0.18, 1.18) * 0.22;
            float alpha = pow(clamp(caustic + secondary, 0.0, 1.0), 1.7) * edgeFade * uOpacity;

            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [color, depthTest, opacity],
  );
}

function useWaterSurfaceMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uShallow: { value: new THREE.Color('#4fb8a8') },
          uDeep: { value: new THREE.Color('#0d3347') },
        },
        vertexShader: `
          uniform float uTime;
          varying vec2 vUv;
          varying float vWave;

          void main() {
            vUv = uv;
            vec3 transformed = position;
            float waveA = sin(position.x * 0.34 + uTime * 0.72) * 0.16;
            float waveB = cos(position.y * 0.29 - uTime * 0.54) * 0.12;
            transformed.z += waveA + waveB;
            vWave = waveA + waveB;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uShallow;
          uniform vec3 uDeep;
          uniform float uTime;
          varying vec2 vUv;
          varying float vWave;

          void main() {
            float radial = length(vUv - 0.5) * 2.0;
            float edge = smoothstep(0.25, 1.0, radial);
            float glint = smoothstep(0.08, 0.28, vWave + sin((vUv.x + vUv.y) * 28.0 + uTime) * 0.035);
            vec3 color = mix(uShallow, uDeep, edge * 0.62) + glint * vec3(0.2, 0.55, 0.58);
            float alpha = mix(0.1, 0.42, edge) + glint * 0.08;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
      }),
    [],
  );
}
