import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { SpeciesId } from '../fishSpecies';
import { ReefMaterial } from './ReefShader';

export function ProceduralCreature({
  paused,
  phase,
  species,
}: {
  paused: boolean;
  phase: number;
  species: SpeciesId;
}) {
  const tail = useRef<THREE.Group>(null);
  const leftFin = useRef<THREE.Group>(null);
  const rightFin = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (paused) return;
    const time = clock.elapsedTime + phase;
    if (tail.current) tail.current.rotation.y = Math.sin(time * 7.2) * 0.42;
    if (leftFin.current) leftFin.current.rotation.z = -0.2 + Math.sin(time * 3.6) * 0.23;
    if (rightFin.current) rightFin.current.rotation.z = 0.2 - Math.sin(time * 3.6) * 0.23;
    if (pulse.current) {
      const breathing = 1 + Math.sin(time * 2.1) * 0.055;
      pulse.current.scale.set(breathing, 1 / breathing, breathing);
    }
  });

  if (species === 'moonJelly') {
    return <MoonJelly pulse={pulse} phase={phase} />;
  }

  if (species === 'seaTurtle') {
    return <SeaTurtle leftFin={leftFin} rightFin={rightFin} />;
  }

  if (species === 'reefShark') {
    return <ReefShark tail={tail} />;
  }

  const palette = {
    emberFish: { body: '#ff9d7a', accent: '#f7f2e4', fin: '#d94f4f' },
    lagoonTang: { body: '#4fb8a8', accent: '#12495c', fin: '#ffd98c' },
    sunfinTang: { body: '#ffd98c', accent: '#f2765c', fin: '#ff9d7a' },
    reefGrouper: { body: '#c079b0', accent: '#ffd98c', fin: '#8e5aa0' },
  }[species];

  return (
    <ReefFish
      accent={palette.accent}
      body={palette.body}
      fin={palette.fin}
      grouper={species === 'reefGrouper'}
      leftFin={leftFin}
      rightFin={rightFin}
      tail={tail}
    />
  );
}

function ReefFish({
  accent,
  body,
  fin,
  grouper,
  leftFin,
  rightFin,
  tail,
}: {
  accent: string;
  body: string;
  fin: string;
  grouper: boolean;
  leftFin: React.RefObject<THREE.Group | null>;
  rightFin: React.RefObject<THREE.Group | null>;
  tail: React.RefObject<THREE.Group | null>;
}) {
  const bodyScale: [number, number, number] = grouper ? [0.5, 0.34, 0.76] : [0.42, 0.27, 0.69];

  return (
    <group scale={grouper ? 1.16 : 1}>
      <mesh scale={bodyScale} castShadow>
        <icosahedronGeometry args={[1, 2]} />
        <ReefMaterial color={body} />
      </mesh>
      <mesh position={[0, 0.02, 0.26]} rotation={[Math.PI / 2, 0, 0]} scale={[0.38, 0.38, 0.22]}>
        <cylinderGeometry args={[1, 1, 0.34, 12]} />
        <ReefMaterial color={accent} />
      </mesh>
      {grouper ? (
        <>
          <Spot position={[0.36, 0.12, 0.18]} color={accent} />
          <Spot position={[-0.38, -0.04, -0.02]} color={accent} />
          <Spot position={[0.25, -0.18, -0.25]} color={accent} />
        </>
      ) : null}
      <group ref={tail} position={[0, 0, -0.7]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.42, 0.54, 0.13]}>
          <coneGeometry args={[0.72, 1, 3]} />
          <ReefMaterial color={fin} />
        </mesh>
      </group>
      <mesh position={[0, 0.31, -0.08]} rotation={[0, 0, Math.PI]} scale={[0.25, 0.4, 0.12]}>
        <coneGeometry args={[0.66, 1, 3]} />
        <ReefMaterial color={fin} />
      </mesh>
      <group ref={leftFin} position={[0.34, -0.05, -0.02]} rotation={[0.25, 0, -0.2]}>
        <mesh scale={[0.25, 0.36, 0.08]}>
          <coneGeometry args={[0.7, 1, 3]} />
          <ReefMaterial color={fin} />
        </mesh>
      </group>
      <group ref={rightFin} position={[-0.34, -0.05, -0.02]} rotation={[-0.25, 0, 0.2]}>
        <mesh scale={[0.25, 0.36, 0.08]}>
          <coneGeometry args={[0.7, 1, 3]} />
          <ReefMaterial color={fin} />
        </mesh>
      </group>
      <Eye x={0.31} />
      <Eye x={-0.31} />
    </group>
  );
}

function Eye({ x }: { x: number }) {
  return (
    <mesh position={[x, 0.12, 0.49]} scale={0.075}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshBasicMaterial color="#06151b" />
    </mesh>
  );
}

function Spot({ color, position }: { color: string; position: [number, number, number] }) {
  return (
    <mesh position={position} scale={0.07}>
      <sphereGeometry args={[1, 8, 6]} />
      <ReefMaterial color={color} />
    </mesh>
  );
}

function MoonJelly({
  phase,
  pulse,
}: {
  phase: number;
  pulse: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group>
      <group ref={pulse}>
        <mesh scale={[0.54, 0.31, 0.54]}>
          <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <ReefMaterial
            color="#e0aecd"
            emissive="#5d4a86"
            emissiveIntensity={0.28}
            opacity={0.82}
            roughness={0.48}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.36, 0.36, 0.08]}>
          <torusGeometry args={[0.75, 0.18, 8, 20]} />
          <ReefMaterial color="#f7f2e4" emissive="#e0aecd" emissiveIntensity={0.22} />
        </mesh>
      </group>
      {[-0.27, -0.09, 0.09, 0.27].map((x, index) => (
        <mesh
          key={x}
          position={[x, -0.56 - (index % 2) * 0.08, Math.sin(phase + index) * 0.08]}
          scale={[0.045, 0.62 + (index % 2) * 0.12, 0.045]}
        >
          <capsuleGeometry args={[1, 1, 4, 8]} />
          <ReefMaterial color="#f7f2e4" emissive="#e0aecd" emissiveIntensity={0.18} />
        </mesh>
      ))}
    </group>
  );
}

function SeaTurtle({
  leftFin,
  rightFin,
}: {
  leftFin: React.RefObject<THREE.Group | null>;
  rightFin: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group>
      <mesh scale={[0.5, 0.22, 0.72]}>
        <icosahedronGeometry args={[1, 2]} />
        <ReefMaterial color="#5f7a63" />
      </mesh>
      <mesh position={[0, 0.01, 0.72]} scale={[0.24, 0.18, 0.3]}>
        <icosahedronGeometry args={[1, 1]} />
        <ReefMaterial color="#d9c295" />
      </mesh>
      <group ref={leftFin} position={[0.48, -0.02, 0.05]} rotation={[0.1, 0.2, -0.2]}>
        <mesh rotation={[0, 0, -0.8]} scale={[0.48, 0.08, 0.22]}>
          <capsuleGeometry args={[1, 1, 4, 8]} />
          <ReefMaterial color="#7c8f7a" />
        </mesh>
      </group>
      <group ref={rightFin} position={[-0.48, -0.02, 0.05]} rotation={[-0.1, -0.2, 0.2]}>
        <mesh rotation={[0, 0, 0.8]} scale={[0.48, 0.08, 0.22]}>
          <capsuleGeometry args={[1, 1, 4, 8]} />
          <ReefMaterial color="#7c8f7a" />
        </mesh>
      </group>
      <mesh position={[0.31, -0.04, -0.57]} rotation={[0.1, 0, -0.5]} scale={[0.25, 0.06, 0.16]}>
        <capsuleGeometry args={[1, 1, 4, 8]} />
        <ReefMaterial color="#7c8f7a" />
      </mesh>
      <mesh position={[-0.31, -0.04, -0.57]} rotation={[-0.1, 0, 0.5]} scale={[0.25, 0.06, 0.16]}>
        <capsuleGeometry args={[1, 1, 4, 8]} />
        <ReefMaterial color="#7c8f7a" />
      </mesh>
      <Eye x={0.15} />
      <Eye x={-0.15} />
    </group>
  );
}

function ReefShark({ tail }: { tail: React.RefObject<THREE.Group | null> }) {
  return (
    <group>
      <mesh scale={[0.34, 0.27, 0.92]}>
        <icosahedronGeometry args={[1, 2]} />
        <ReefMaterial color="#9aa3a6" />
      </mesh>
      <mesh position={[0, -0.11, 0.13]} scale={[0.3, 0.14, 0.78]}>
        <icosahedronGeometry args={[1, 1]} />
        <ReefMaterial color="#f7f2e4" />
      </mesh>
      <group ref={tail} position={[0, 0, -0.95]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.5, 0.62, 0.1]}>
          <coneGeometry args={[0.72, 1, 3]} />
          <ReefMaterial color="#6e777b" />
        </mesh>
      </group>
      <mesh position={[0, 0.35, -0.16]} rotation={[0, 0, Math.PI]} scale={[0.3, 0.46, 0.1]}>
        <coneGeometry args={[0.68, 1, 3]} />
        <ReefMaterial color="#6e777b" />
      </mesh>
      <mesh position={[0.36, -0.08, 0.02]} rotation={[0.2, 0, -0.7]} scale={[0.32, 0.44, 0.08]}>
        <coneGeometry args={[0.66, 1, 3]} />
        <ReefMaterial color="#6e777b" />
      </mesh>
      <mesh position={[-0.36, -0.08, 0.02]} rotation={[-0.2, 0, 0.7]} scale={[0.32, 0.44, 0.08]}>
        <coneGeometry args={[0.66, 1, 3]} />
        <ReefMaterial color="#6e777b" />
      </mesh>
      <Eye x={0.25} />
      <Eye x={-0.25} />
    </group>
  );
}
