import { useMemo } from 'react';
import * as THREE from 'three';

export function BottomFog() {
  return (
    <group>
      <MistVolume color="#a4f4ff" opacity={1.18} position={[0, -7.65, -1]} scale={[48, 7.4, 48]} seed={0.15} />
      <MistVolume color="#65d6ea" opacity={0.92} position={[4, -8.65, -4]} scale={[58, 8.8, 54]} seed={0.54} />
      <MistVolume color="#2d8faa" opacity={0.72} position={[-5, -9.25, 3]} scale={[52, 8, 50]} seed={0.83} />
      <mesh position={[0, -4.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[24, 128]} />
        <meshBasicMaterial color="#082d3c" transparent opacity={0.04} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function LightRays() {
  const rays = useMemo(
    () => [
      { position: [-10, 2.6, -11], rotation: [0.38, 0.18, -0.24], scale: [7.5, 26, 7.5], opacity: 0.14, seed: 0.12 },
      { position: [-2, 3.2, -10], rotation: [0.22, -0.25, 0.16], scale: [6.4, 24, 6.4], opacity: 0.12, seed: 0.47 },
      { position: [7, 2.8, -11], rotation: [0.34, -0.16, 0.27], scale: [8.2, 28, 8.2], opacity: 0.13, seed: 0.78 },
      { position: [12, 2.4, -4], rotation: [0.18, 0.2, -0.25], scale: [5.7, 21, 5.7], opacity: 0.095, seed: 0.94 },
      { position: [-14, 2.2, 1], rotation: [0.28, 0.34, -0.31], scale: [6.5, 23, 6.5], opacity: 0.09, seed: 0.31 },
    ],
    [],
  );

  return (
    <group>
      {rays.map((ray, index) => (
        <VolumetricRay
          key={index}
          color="#baf8ff"
          opacity={ray.opacity}
          position={ray.position as [number, number, number]}
          rotation={ray.rotation as [number, number, number]}
          scale={ray.scale as [number, number, number]}
          seed={ray.seed}
        />
      ))}
    </group>
  );
}

function VolumetricRay({
  color,
  opacity,
  position,
  rotation,
  scale,
  seed,
}: {
  color: string;
  opacity: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  seed: number;
}) {
  const material = useVolumeMaterial({
    color,
    opacity,
    seed,
    mode: 'ray',
    blending: THREE.AdditiveBlending,
    depthTest: true,
    side: THREE.BackSide,
  });

  return (
    <mesh position={position} rotation={rotation} scale={scale} material={material} renderOrder={1}>
      <coneGeometry args={[1, 1, 56, 18, true]} />
    </mesh>
  );
}

function MistVolume({
  color,
  opacity,
  position,
  scale,
  seed,
}: {
  color: string;
  opacity: number;
  position: [number, number, number];
  scale: [number, number, number];
  seed: number;
}) {
  const material = useVolumeMaterial({
    color,
    opacity,
    seed,
    mode: 'mist',
    blending: THREE.NormalBlending,
    depthTest: false,
    side: THREE.DoubleSide,
  });

  return (
    <mesh position={position} scale={scale} material={material} renderOrder={2}>
      <sphereGeometry args={[1, 64, 32]} />
    </mesh>
  );
}

function useVolumeMaterial({
  color,
  opacity,
  seed,
  mode,
  blending,
  depthTest,
  side,
}: {
  color: string;
  opacity: number;
  seed: number;
  mode: 'mist' | 'ray';
  blending: THREE.Blending;
  depthTest: boolean;
  side: THREE.Side;
}) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uSeed: { value: seed },
          uMode: { value: mode === 'mist' ? 0 : 1 },
        },
        vertexShader: `
          varying vec3 vLocalPosition;

          void main() {
            vLocalPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uSeed;
          uniform int uMode;
          varying vec3 vLocalPosition;

          float hash(vec3 p) {
            return fract(sin(dot(p, vec3(127.1, 311.7, 74.7)) + uSeed * 97.3) * 43758.5453123);
          }

          float noise(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            vec3 u = f * f * (3.0 - 2.0 * f);

            return mix(
              mix(
                mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), u.x),
                mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), u.x),
                u.y
              ),
              mix(
                mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), u.x),
                mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), u.x),
                u.y
              ),
              u.z
            );
          }

          float fbm(vec3 p) {
            float value = 0.0;
            float amp = 0.5;
            for (int i = 0; i < 4; i++) {
              value += noise(p) * amp;
              p *= 2.03;
              amp *= 0.5;
            }
            return value;
          }

          void main() {
            float alpha = 0.0;

            if (uMode == 0) {
              vec3 p = vLocalPosition;
              float radial = length(p.xz);
              float dome = 1.0 - smoothstep(0.2, 1.0, radial);
              float vertical = (1.0 - smoothstep(-0.05, 0.95, p.y)) * smoothstep(-1.0, -0.48, p.y);
              float grain = fbm(p * vec3(3.2, 1.4, 3.2) + vec3(uSeed));
              alpha = dome * vertical * mix(0.78, 1.35, grain) * uOpacity;
            } else {
              vec3 p = vLocalPosition;
              float y = clamp(p.y + 0.5, 0.0, 1.0);
              float coneRadius = max(0.08, 1.0 - y);
              float radial = length(p.xz);
              float core = 1.0 - smoothstep(coneRadius * 0.12, coneRadius, radial);
              float vertical = smoothstep(0.02, 0.2, y) * (1.0 - smoothstep(0.18, 1.0, y));
              float grain = fbm(p * vec3(2.3, 5.5, 2.3) + vec3(uSeed));
              alpha = core * vertical * smoothstep(0.12, 0.9, grain) * uOpacity;
            }

            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest,
        side,
        blending,
      }),
    [blending, color, depthTest, mode, opacity, seed, side],
  );
}
