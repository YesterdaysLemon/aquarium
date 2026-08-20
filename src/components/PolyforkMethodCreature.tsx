import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SpeciesId } from '../fishSpecies';
import { decorateReefMaterial, useReefUniforms } from './ReefShader';

export type FinnedSpeciesId = Extract<
  SpeciesId,
  'emberFish' | 'lagoonTang' | 'sunfinTang' | 'reefGrouper' | 'reefShark'
>;

const finnedSpecies = new Set<SpeciesId>([
  'emberFish',
  'lagoonTang',
  'sunfinTang',
  'reefGrouper',
  'reefShark',
]);

const palettes: Record<
  FinnedSpeciesId,
  { body: string; belly: string; dorsal: string; fin: string }
> = {
  emberFish: { body: '#ff9d7a', belly: '#f7f2e4', dorsal: '#d94f4f', fin: '#b8452f' },
  lagoonTang: { body: '#4fb8a8', belly: '#ffd98c', dorsal: '#1d6b73', fin: '#2c8f8a' },
  sunfinTang: { body: '#ffd98c', belly: '#f7f2e4', dorsal: '#f2765c', fin: '#d94f4f' },
  reefGrouper: { body: '#c079b0', belly: '#ffd98c', dorsal: '#5d4a86', fin: '#8e5aa0' },
  reefShark: { body: '#9aa3a6', belly: '#f7f2e4', dorsal: '#59666d', fin: '#6e777b' },
};

const dimensions: Record<FinnedSpeciesId, [number, number, number]> = {
  emberFish: [0.46, 0.3, 0.73],
  lagoonTang: [0.48, 0.32, 0.75],
  sunfinTang: [0.47, 0.31, 0.74],
  reefGrouper: [0.57, 0.4, 0.76],
  reefShark: [0.38, 0.29, 1.02],
};

export function supportsPackMethod(species: SpeciesId): species is FinnedSpeciesId {
  return finnedSpecies.has(species);
}

export function PolyforkMethodCreature({
  health,
  paused,
  phase,
  species,
}: {
  health: number;
  paused: boolean;
  phase: number;
  species: FinnedSpeciesId;
}) {
  const tail = useRef<THREE.Group>(null);
  const leftFin = useRef<THREE.Group>(null);
  const rightFin = useRef<THREE.Group>(null);
  const uniforms = useReefUniforms();
  const palette = palettes[species];
  const [width, height, length] = dimensions[species];
  const grouperScale = species === 'reefGrouper' ? 1.1 : 1;
  const sharkScale = species === 'reefShark' ? 1.12 : 1;
  const growth = 0.84 + health * 0.16;

  const material = useMemo(
    () =>
      decorateReefMaterial(
        new THREE.MeshStandardMaterial({
          color: '#ffffff',
          flatShading: true,
          metalness: 0,
          roughness: 0.85,
          vertexColors: true,
        }),
        uniforms,
      ) as THREE.MeshStandardMaterial,
    [uniforms],
  );

  const bodyGeometry = useMemo(
    () => buildBodyGeometry(species, health, palette, dimensions[species]),
    [health, palette, species],
  );
  const finGeometry = useMemo(
    () => paintGeometry(new THREE.ConeGeometry(0.68, 1, 3), palette.fin),
    [palette.fin],
  );
  const eyeGeometry = useMemo(
    () => paintGeometry(new THREE.IcosahedronGeometry(1, 0), '#06151b'),
    [],
  );

  useEffect(
    () => () => {
      bodyGeometry.dispose();
    },
    [bodyGeometry],
  );

  useEffect(
    () => () => {
      finGeometry.dispose();
      eyeGeometry.dispose();
      material.dispose();
    },
    [eyeGeometry, finGeometry, material],
  );

  useFrame(({ clock }) => {
    if (paused) return;
    const time = clock.elapsedTime + phase;
    if (tail.current) tail.current.rotation.y = Math.sin(time * 7.2) * 0.42;
    if (leftFin.current) leftFin.current.rotation.z = -0.18 + Math.sin(time * 3.6) * 0.2;
    if (rightFin.current) rightFin.current.rotation.z = 0.18 - Math.sin(time * 3.6) * 0.2;
  });

  return (
    <group scale={grouperScale * sharkScale}>
      <mesh geometry={bodyGeometry} material={material} castShadow />
      <group ref={tail} position={[0, 0, -length * 0.94]}>
        <mesh
          geometry={finGeometry}
          material={material}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[
            (species === 'reefShark' ? 0.52 : 0.41) * growth,
            (species === 'reefShark' ? 0.66 : 0.52) * growth,
            0.13,
          ]}
        />
      </group>
      <mesh
        geometry={finGeometry}
        material={material}
        position={[0, height * 0.98, -length * 0.12]}
        rotation={[0, 0, Math.PI]}
        scale={[
          (species === 'reefShark' ? 0.34 : 0.24) * growth,
          (species === 'reefShark' ? 0.5 : 0.38) * growth,
          0.11,
        ]}
      />
      <group ref={leftFin} position={[width * 0.88, -height * 0.06, 0]} rotation={[0.2, 0, -0.18]}>
        <mesh
          geometry={finGeometry}
          material={material}
          scale={[0.25 * growth, 0.36 * growth, 0.08]}
        />
      </group>
      <group ref={rightFin} position={[-width * 0.88, -height * 0.06, 0]} rotation={[-0.2, 0, 0.18]}>
        <mesh
          geometry={finGeometry}
          material={material}
          scale={[0.25 * growth, 0.36 * growth, 0.08]}
        />
      </group>
      {[1, -1].map((side) => (
        <mesh
          key={side}
          geometry={eyeGeometry}
          material={material}
          position={[side * width * 0.72, height * 0.3, length * 0.67]}
          scale={species === 'reefShark' ? 0.062 : 0.07}
        />
      ))}
    </group>
  );
}

function buildBodyGeometry(
  species: FinnedSpeciesId,
  health: number,
  palette: { body: string; belly: string; dorsal: string; fin: string },
  size: [number, number, number],
) {
  const source = new THREE.IcosahedronGeometry(1, 1);
  const geometry = toNonIndexed(source);
  geometry.deleteAttribute('uv');
  geometry.deleteAttribute('normal');

  const [width, height, length] = size;
  const girth = 0.86 + health * 0.14;
  const reach = 0.92 + health * 0.08;
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let index = 0; index < positions.count; index += 1) {
    const originalX = positions.getX(index);
    const originalY = positions.getY(index);
    const originalZ = positions.getZ(index);
    const noseFullness = originalZ > 0 ? 1 : 0.92 + (originalZ + 1) * 0.08;
    positions.setXYZ(
      index,
      originalX * width * girth * noseFullness,
      originalY * height * girth,
      originalZ * length * reach,
    );
  }

  const colors = new Float32Array(positions.count * 3);
  for (let triangle = 0; triangle < positions.count; triangle += 3) {
    const centerY =
      (positions.getY(triangle) + positions.getY(triangle + 1) + positions.getY(triangle + 2)) / 3;
    const centerZ =
      (positions.getZ(triangle) + positions.getZ(triangle + 1) + positions.getZ(triangle + 2)) / 3;
    const isBelly = centerY < -height * 0.16;
    const isDorsal = centerY > height * 0.42;
    const isFacePatch = species !== 'reefShark' && centerZ > length * 0.34 && !isBelly;
    const color = new THREE.Color(
      isBelly ? palette.belly : isDorsal ? palette.dorsal : isFacePatch ? palette.fin : palette.body,
    );

    for (let vertex = 0; vertex < 3; vertex += 1) {
      const offset = (triangle + vertex) * 3;
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function paintGeometry(source: THREE.BufferGeometry, hex: string) {
  const geometry = toNonIndexed(source);
  geometry.deleteAttribute('uv');
  geometry.deleteAttribute('normal');
  const color = new THREE.Color(hex);
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  for (let index = 0; index < positions.count; index += 1) {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function toNonIndexed(source: THREE.BufferGeometry) {
  if (!source.index) return source;
  const geometry = source.toNonIndexed();
  source.dispose();
  return geometry;
}
