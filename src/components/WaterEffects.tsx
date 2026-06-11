import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export function WaterEffects({ paused }: { paused: boolean }) {
  return (
    <group>
      <CausticField paused={paused} />
      <SurfaceShimmer paused={paused} />
    </group>
  );
}

function CausticField({ paused }: { paused: boolean }) {
  const material = useAnimatedWaterMaterial({
    color: '#bff7ff',
    mode: 'caustics',
    opacity: 0.055,
    depthTest: true,
  });

  useFrame((_, delta) => {
    if (paused) return;
    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={[0, -7.15, 0]} rotation={[Math.PI / 2, 0, 0]} material={material} renderOrder={1}>
      <circleGeometry args={[26, 160]} />
    </mesh>
  );
}

function SurfaceShimmer({ paused }: { paused: boolean }) {
  const material = useAnimatedWaterMaterial({
    color: '#8eefff',
    mode: 'surface',
    opacity: 0.026,
    depthTest: false,
  });

  useFrame((_, delta) => {
    if (paused) return;
    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={[0, 9.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={material} renderOrder={0}>
      <planeGeometry args={[54, 54, 1, 1]} />
    </mesh>
  );
}

function useAnimatedWaterMaterial({
  color,
  depthTest,
  mode,
  opacity,
}: {
  color: string;
  depthTest: boolean;
  mode: 'caustics' | 'surface';
  opacity: number;
}) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uMode: { value: mode === 'caustics' ? 0 : 1 },
          uOpacity: { value: opacity },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vLocalPosition;

          void main() {
            vUv = uv;
            vLocalPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform int uMode;
          uniform float uOpacity;
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vLocalPosition;

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
            float alpha = 0.0;

            if (uMode == 0) {
              vec2 worldish = vLocalPosition.xz * 0.16;
              float caustic =
                linePattern(worldish, 0.36, 0.35) *
                linePattern(worldish * 1.13 + 3.2, -0.22, -0.72);
              float secondary = linePattern(worldish * 0.76 - 1.1, 0.18, 1.18) * 0.22;
              alpha = pow(clamp(caustic + secondary, 0.0, 1.0), 1.7) * edgeFade * uOpacity;
            } else {
              float ripples =
                sin((p.x + uTime * 0.04) * 16.0) *
                sin((p.y - uTime * 0.035) * 13.0);
              float shimmer = smoothstep(0.55, 1.0, ripples * 0.5 + 0.5);
              alpha = shimmer * edgeFade * uOpacity;
            }

            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [color, depthTest, mode, opacity],
  );
}
