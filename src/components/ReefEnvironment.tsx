import { useFrame, useLoader } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cloneWithReefLook, ReefMaterial, useReefUniforms } from './ReefShader';

const POLYFORK_CDN = 'https://polyfork.dev/cdn';

type Placement = {
  id: string;
  asset: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  sway?: number;
};

const polyforkPlacements: Placement[] = [
  { id: 'anchor', asset: 'admiralty-anchor-bd6882', position: [-8.8, -7.8, 0.8], rotation: [0.08, 0.72, -0.24], scale: 1.22 },
  { id: 'algae-a', asset: 'broad-algae-frond-88a644', position: [-4.8, -6.9, 4.7], rotation: [0, -0.5, 0], scale: 2.05, sway: 0.08 },
  { id: 'algae-b', asset: 'broad-algae-frond-88a644', position: [6.8, -7.1, -3.5], rotation: [0, 0.9, 0], scale: 1.95, sway: 0.07 },
  { id: 'amphora', asset: 'clay-amphora-098d94', position: [-5.9, -7.72, -4.4], rotation: [0.1, -0.42, -0.15], scale: 1.35 },
  { id: 'rubble-a', asset: 'rubble-scatter-decal-61332b', position: [-5.8, -7.92, 5.6], rotation: [0, 0, 0], scale: 1.2 },
  { id: 'rubble-b', asset: 'rubble-scatter-decal-61332b', position: [5.8, -7.91, -5.4], rotation: [0, Math.PI / 2, 0], scale: 1.16 },
  { id: 'seabed-a', asset: 'coral-rubble-seabed-tile-772a1f', position: [-2.1, -7.94, -5.8], rotation: [0, 0, 0], scale: 1.35 },
  { id: 'seabed-b', asset: 'coral-rubble-seabed-tile-772a1f', position: [3.3, -7.93, 5.1], rotation: [0, Math.PI / 2, 0], scale: 1.3 },
  { id: 'buoy', asset: 'dive-marker-buoy-21beb7', position: [10.6, -7.8, -9.5], rotation: [0, -0.2, 0.05], scale: 1.05, sway: 0.025 },
  { id: 'pillar-a', asset: 'pillar-coral-b6deba', position: [-6.4, -1.65, 0.8], rotation: [0, 0.4, 0], scale: 1.78 },
  { id: 'urchin-a', asset: 'sea-urchin-b599d4', position: [4.5, -7.35, 1.8], rotation: [0.2, 0.2, 0.08], scale: 1.32 },
  { id: 'urchin-b', asset: 'sea-urchin-b599d4', position: [-6.6, -7.25, 3.1], rotation: [0.1, 0.8, -0.08], scale: 1.05 },
  { id: 'whip-a', asset: 'sea-whip-e56668', position: [5.7, -1.2, 1.3], rotation: [0, -0.7, 0], scale: 1.72, sway: 0.045 },
  { id: 'whip-b', asset: 'sea-whip-e56668', position: [-7.1, -7.5, -2.5], rotation: [0, 0.5, 0], scale: 1.22, sway: 0.05 },
  { id: 'grass-a', asset: 'seagrass-tuft-862cc5', position: [7.1, -7.75, 3.9], rotation: [0, -0.7, 0], scale: 2.15, sway: 0.09 },
  { id: 'grass-b', asset: 'seagrass-tuft-862cc5', position: [5.6, -7.72, 5.7], rotation: [0, 0.2, 0], scale: 1.92, sway: 0.08 },
  { id: 'rock-a', asset: 'small-reef-rock-99062d', position: [-8.2, -7.7, -4.7], rotation: [0, 0.6, 0], scale: 2.25 },
  { id: 'rock-b', asset: 'small-reef-rock-99062d', position: [8.4, -7.65, 5.1], rotation: [0, -0.3, 0], scale: 2.5 },
  { id: 'staghorn-a', asset: 'staghorn-coral-422d23', position: [7.2, -7.72, 0.6], rotation: [0, -0.6, 0], scale: 1.82 },
  { id: 'staghorn-b', asset: 'staghorn-coral-422d23', position: [0.2, -2.1, -4.6], rotation: [0, 1.1, 0], scale: 1.62 },
  { id: 'table-coral-a', asset: 'table-coral-193fa6', position: [-5.2, -7.65, 6.5], rotation: [0, 0.7, 0], scale: 1.65 },
  { id: 'table-coral-b', asset: 'table-coral-193fa6', position: [3.3, -5.65, 3.6], rotation: [0, -0.5, 0], scale: 1.42 },
];

export function ReefEnvironment() {
  return (
    <group>
      <ProceduralSeabed />
      <ReefArch />
      <CoralGardens />
      {polyforkPlacements.map((placement) => (
        <PolyforkAsset key={placement.id} {...placement} />
      ))}
    </group>
  );
}

function PolyforkAsset({
  asset,
  id,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  sway = 0,
}: Placement) {
  const group = useRef<THREE.Group>(null);
  const uniforms = useReefUniforms();
  const gltf = useLoader(GLTFLoader, `${POLYFORK_CDN}/${asset}.glb`);
  const object = useMemo(() => cloneWithReefLook(gltf.scene, uniforms), [gltf.scene, uniforms]);
  const swayPhase = useMemo(() => id.length * 0.73, [id]);

  useFrame(({ clock }) => {
    if (!group.current || sway === 0) return;
    group.current.rotation.z = rotation[2] + Math.sin(clock.elapsedTime * 0.7 + swayPhase) * sway;
    group.current.rotation.x = rotation[0] + Math.cos(clock.elapsedTime * 0.54 + swayPhase) * sway * 0.32;
  });

  return (
    <group ref={group} name={`polyfork-${asset}`} position={position} rotation={rotation} scale={scale}>
      <primitive object={object} />
    </group>
  );
}

function ProceduralSeabed() {
  return (
    <group>
      <mesh position={[0, -8.25, 0]} scale={[1.05, 0.13, 1]} receiveShadow>
        <cylinderGeometry args={[29, 31, 2.6, 36, 2]} />
        <ReefMaterial color="#8f7b5a" roughness={0.96} />
      </mesh>
      <mesh position={[-1.5, -7.3, 0.4]} scale={[8.2, 1.5, 6.7]} rotation={[0.03, 0.2, -0.04]} receiveShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <ReefMaterial color="#8d7a5c" roughness={0.98} />
      </mesh>
      <ReefRock position={[-6.2, -5.8, 0.9]} scale={[3.2, 4.5, 2.7]} rotation={[0.08, -0.24, -0.15]} color="#6e5a4a" />
      <ReefRock position={[5.6, -5.9, 1.2]} scale={[3.4, 4.1, 3]} rotation={[-0.06, 0.35, 0.13]} color="#7c8f7a" />
      <ReefRock position={[0.2, -5.2, -4.6]} scale={[2.7, 3.2, 2.35]} rotation={[0.04, -0.2, 0.04]} color="#5f7a63" />
      <ReefRock position={[3.4, -6.6, 5.1]} scale={[3.4, 1.9, 2.8]} rotation={[0.02, 0.5, 0.05]} color="#8d7a5c" />
    </group>
  );
}

function ReefRock({
  color,
  position,
  rotation,
  scale,
}: {
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 1]} />
      <ReefMaterial color={color} roughness={0.96} />
    </mesh>
  );
}

function ReefArch() {
  return (
    <group position={[-0.7, -7.2, 4.6]} scale={[1.1, 1.08, 0.9]}>
      <mesh castShadow receiveShadow>
        <torusGeometry args={[4.2, 1.05, 7, 32, Math.PI]} />
        <ReefMaterial color="#4f7564" roughness={0.95} />
      </mesh>
      <mesh position={[-4.15, -0.7, 0]} scale={[1.25, 1.9, 1.3]}>
        <dodecahedronGeometry args={[1, 0]} />
        <ReefMaterial color="#5f7a63" />
      </mesh>
      <mesh position={[4.15, -0.7, 0]} scale={[1.25, 1.9, 1.3]}>
        <dodecahedronGeometry args={[1, 0]} />
        <ReefMaterial color="#5f7a63" />
      </mesh>
    </group>
  );
}

function CoralGardens() {
  const branches = [
    { x: -8.5, z: 5.8, color: '#ff9d7a', phase: 0.2 },
    { x: 8.7, z: -4.9, color: '#e0aecd', phase: 1.2 },
    { x: 4.1, z: 6.9, color: '#f2765c', phase: 2.1 },
    { x: -4.2, z: -6.4, color: '#c079b0', phase: 2.9 },
  ];

  return (
    <group>
      {branches.map((branch) => (
        <BranchCoral key={`${branch.x}-${branch.z}`} {...branch} />
      ))}
      <SpongeCluster position={[8.2, -7.55, 2.2]} />
      <SpongeCluster position={[-7.8, -7.56, -1.8]} rotation={0.7} />
    </group>
  );
}

function BranchCoral({ color, phase, x, z }: { color: string; phase: number; x: number; z: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.48 + phase) * 0.025;
  });

  return (
    <group ref={group} position={[x, -7.6, z]}>
      {[0, 1, 2, 3, 4].map((index) => {
        const angle = -0.72 + index * 0.36;
        const height = 1.25 + (index % 3) * 0.35;
        return (
          <mesh key={index} position={[Math.sin(angle) * 0.55, height * 0.42, Math.cos(angle) * 0.2]} rotation={[0, 0, angle * 0.42]} scale={[0.12, height * 0.5, 0.12]}>
            <cylinderGeometry args={[0.58, 0.9, 2, 7]} />
            <ReefMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

function SpongeCluster({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[(index - 1.5) * 0.32, 0.35 + (index % 2) * 0.18, Math.sin(index) * 0.25]} scale={[0.24, 0.52 + (index % 2) * 0.2, 0.24]}>
          <cylinderGeometry args={[0.72, 1, 1.5, 9, 1, true]} />
          <ReefMaterial color={index % 2 ? '#ffb96b' : '#8e5aa0'} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
