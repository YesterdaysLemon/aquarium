import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

type VolumeMode = 'mist' | 'ray';

type VolumeProps = {
  blending: THREE.Blending;
  color: string;
  depthTest: boolean;
  mode: VolumeMode;
  opacity: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  seed: number;
};

export function BottomFog() {
  return (
    <group>
      <RaymarchedVolume
        blending={THREE.NormalBlending}
        color="#78edf2"
        depthTest={false}
        mode="mist"
        opacity={0.82}
        position={[0, -8.05, -1]}
        scale={[31, 5.1, 31]}
        seed={0.15}
      />
      <RaymarchedVolume
        blending={THREE.NormalBlending}
        color="#2ca7b8"
        depthTest={false}
        mode="mist"
        opacity={0.72}
        position={[4, -9.05, -4]}
        scale={[38, 6.1, 34]}
        seed={0.54}
      />
      <RaymarchedVolume
        blending={THREE.NormalBlending}
        color="#0d5266"
        depthTest={false}
        mode="mist"
        opacity={0.66}
        position={[-5, -9.75, 3]}
        scale={[33, 5.4, 32]}
        seed={0.83}
      />
      <mesh position={[0, -6.85, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[28, 160]} />
        <meshBasicMaterial color="#031923" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function LightRays() {
  const rays = useMemo(
    () => [
      { position: [-10, 2.7, -11], rotation: [0.38, 0.18, -0.24], scale: [9, 28, 9], opacity: 0.34, seed: 0.12 },
      { position: [-2, 3.3, -10], rotation: [0.22, -0.25, 0.16], scale: [7.6, 26, 7.6], opacity: 0.25, seed: 0.47 },
      { position: [7, 2.9, -11], rotation: [0.34, -0.16, 0.27], scale: [9.6, 30, 9.6], opacity: 0.27, seed: 0.78 },
      { position: [12, 2.5, -4], rotation: [0.18, 0.2, -0.25], scale: [7, 23, 7], opacity: 0.19, seed: 0.94 },
      { position: [-14, 2.3, 1], rotation: [0.28, 0.34, -0.31], scale: [7.8, 25, 7.8], opacity: 0.18, seed: 0.31 },
    ],
    [],
  );

  return (
    <group>
      {rays.map((ray, index) => (
        <RaymarchedVolume
          key={index}
          blending={THREE.AdditiveBlending}
          color="#c8fbff"
          depthTest
          mode="ray"
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

function RaymarchedVolume({
  blending,
  color,
  depthTest,
  mode,
  opacity,
  position,
  rotation = [0, 0, 0],
  scale,
  seed,
}: VolumeProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const cameraLocal = useRef(new THREE.Vector3());
  const material = useRaymarchedVolumeMaterial({
    blending,
    color,
    depthTest,
    mode,
    opacity,
    seed,
  });

  useFrame(() => {
    if (!mesh.current) return;
    cameraLocal.current.copy(camera.position);
    mesh.current.worldToLocal(cameraLocal.current);
    material.uniforms.uCameraLocal.value.copy(cameraLocal.current);
  });

  return (
    <mesh ref={mesh} position={position} rotation={rotation} scale={scale} material={material} renderOrder={mode === 'mist' ? 3 : 1}>
      <sphereGeometry args={[1, mode === 'mist' ? 64 : 40, mode === 'mist' ? 32 : 20]} />
    </mesh>
  );
}

function useRaymarchedVolumeMaterial({
  blending,
  color,
  depthTest,
  mode,
  opacity,
  seed,
}: {
  blending: THREE.Blending;
  color: string;
  depthTest: boolean;
  mode: VolumeMode;
  opacity: number;
  seed: number;
}) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uCameraLocal: { value: new THREE.Vector3(0, 0, 3) },
          uColor: { value: new THREE.Color(color) },
          uMode: { value: mode === 'mist' ? 0 : 1 },
          uOpacity: { value: opacity },
          uSeed: { value: seed },
        },
        vertexShader: `
          varying vec3 vLocalPosition;

          void main() {
            vLocalPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uCameraLocal;
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uSeed;
          uniform int uMode;
          varying vec3 vLocalPosition;

          vec2 intersectSphere(vec3 ro, vec3 rd) {
            float b = dot(ro, rd);
            float c = dot(ro, ro) - 1.0;
            float h = b * b - c;
            if (h < 0.0) {
              return vec2(1.0, -1.0);
            }
            h = sqrt(h);
            return vec2(-b - h, -b + h);
          }

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
            for (int i = 0; i < 5; i++) {
              value += noise(p) * amp;
              p *= 2.04;
              amp *= 0.5;
            }
            return value;
          }

          float mistDensity(vec3 p) {
            float radial = length(p.xz);
            float edge = 1.0 - smoothstep(0.52, 0.98, radial);
            float grain = fbm(p * vec3(2.7, 0.86, 2.7) + vec3(uSeed * 3.1));
            float raggedY = p.y + (grain - 0.5) * 0.5;
            float topFade = 1.0 - smoothstep(-0.34, 0.58, raggedY);
            float bottomFade = smoothstep(-0.96, -0.5, p.y);
            float lowBank = smoothstep(0.62, -0.24, p.y);
            float pockets = mix(0.58, 1.28, grain);
            return edge * topFade * bottomFade * lowBank * pockets;
          }

          float rayDensity(vec3 p) {
            float h = clamp(p.y * 0.5 + 0.5, 0.0, 1.0);
            float coneRadius = mix(0.58, 0.08, h);
            float radial = length(p.xz);
            float core = 1.0 - smoothstep(coneRadius * 0.18, coneRadius, radial);
            float vertical = smoothstep(0.03, 0.22, h) * (1.0 - smoothstep(0.72, 1.0, h));
            float grain = fbm(p * vec3(3.4, 7.2, 3.4) + vec3(uSeed));
            float lanes = smoothstep(0.18, 0.86, grain);
            return core * vertical * lanes;
          }

          void main() {
            vec3 ro = uCameraLocal;
            vec3 rd = normalize(vLocalPosition - ro);
            vec2 hit = intersectSphere(ro, rd);

            if (hit.x > hit.y || hit.y < 0.0) {
              discard;
            }

            float t0 = max(hit.x, 0.0);
            float t1 = hit.y;
            float travel = max(t1 - t0, 0.0);
            float stepSize = travel / 24.0;
            float accumulated = 0.0;

            for (int i = 0; i < 24; i++) {
              float t = t0 + (float(i) + 0.5) * stepSize;
              vec3 p = ro + rd * t;
              float density = uMode == 0 ? mistDensity(p) : rayDensity(p);
              accumulated += density * stepSize;
            }

            float alpha = 1.0 - exp(-accumulated * uOpacity * (uMode == 0 ? 1.72 : 1.46));
            alpha = clamp(alpha, 0.0, uMode == 0 ? 0.76 : 0.36);
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest,
        side: THREE.BackSide,
        blending,
      }),
    [blending, color, depthTest, mode, opacity, seed],
  );
}
