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
        depthTest
        mode="mist"
        opacity={0.58}
        position={[0, -9.05, -1]}
        scale={[30, 3.7, 30]}
        seed={0.15}
      />
      <RaymarchedVolume
        blending={THREE.NormalBlending}
        color="#2ca7b8"
        depthTest
        mode="mist"
        opacity={0.62}
        position={[4, -9.85, -4]}
        scale={[37, 4.3, 34]}
        seed={0.54}
      />
      <RaymarchedVolume
        blending={THREE.NormalBlending}
        color="#0d5266"
        depthTest
        mode="mist"
        opacity={0.7}
        position={[-5, -10.55, 3]}
        scale={[34, 4.8, 32]}
        seed={0.83}
      />
      <mesh position={[0, -10.15, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[28, 160]} />
        <meshBasicMaterial color="#031923" transparent opacity={0.09} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function LightRays() {
  const rays = useMemo(
    () => [
      { position: [-10.8, 3.25, -14.3], scale: [3.7, 31, 3.7], opacity: 0.18, seed: 0.12 },
      { position: [9.4, 2.95, -12.6], scale: [3.35, 29, 3.35], opacity: 0.15, seed: 0.47 },
      { position: [0.7, 3.35, -8.8], scale: [4.15, 32, 4.15], opacity: 0.18, seed: 0.78 },
      { position: [-12.1, 2.75, -4.2], scale: [3.25, 28, 3.25], opacity: 0.13, seed: 0.94 },
      { position: [10.6, 2.85, -3.5], scale: [3.45, 28, 3.45], opacity: 0.14, seed: 0.31 },
    ],
    [],
  );
  const rayRotation: [number, number, number] = [0.14, 0, -0.18];

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
          rotation={rayRotation}
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
      {mode === 'mist' ? (
        <sphereGeometry args={[1, 64, 32]} />
      ) : (
        <cylinderGeometry args={[1, 1, 1, 40, 1, false]} />
      )}
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

          vec2 intersectCylinder(vec3 ro, vec3 rd) {
            vec2 side = vec2(-100000.0, 100000.0);
            float a = dot(rd.xz, rd.xz);
            float c = dot(ro.xz, ro.xz) - 1.0;

            if (a > 0.0001) {
              float b = 2.0 * dot(ro.xz, rd.xz);
              float h = b * b - 4.0 * a * c;
              if (h < 0.0) {
                return vec2(1.0, -1.0);
              }
              h = sqrt(h);
              side = vec2((-b - h) / (2.0 * a), (-b + h) / (2.0 * a));
            } else if (c > 0.0) {
              return vec2(1.0, -1.0);
            }

            float dy = abs(rd.y) < 0.0001 ? (rd.y < 0.0 ? -0.0001 : 0.0001) : rd.y;
            vec2 cap = vec2((-0.5 - ro.y) / dy, (0.5 - ro.y) / dy);
            float yMin = min(cap.x, cap.y);
            float yMax = max(cap.x, cap.y);
            return vec2(max(side.x, yMin), min(side.y, yMax));
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
            float h = clamp(p.y + 0.5, 0.0, 1.0);
            float radial = length(p.xz);
            float core = 1.0 - smoothstep(0.34, 0.94, radial);
            float vertical = smoothstep(0.03, 0.18, h) * (1.0 - smoothstep(0.78, 1.0, h));
            float grain = fbm(p * vec3(4.8, 5.2, 4.8) + vec3(uSeed));
            float lanes = smoothstep(0.22, 0.88, grain);
            return core * vertical * lanes;
          }

          void main() {
            vec3 ro = uCameraLocal;
            vec3 rd = normalize(vLocalPosition - ro);
            vec2 hit = uMode == 0 ? intersectSphere(ro, rd) : intersectCylinder(ro, rd);

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
