import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { ArrowLeft, Boxes, MousePointer2, Sprout } from 'lucide-react';
import { Suspense, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { fishSpecies, type SpeciesId } from '../fishSpecies';
import { ProceduralCreature } from './ProceduralCreature';
import {
  cloneWithReefLook,
  ReefMaterial,
  ReefShaderProvider,
  useReefUniforms,
} from './ReefShader';

const POLYFORK_CDN = 'https://polyfork.dev/cdn';

type ExhibitSource = 'pack' | 'generated';

type PackExhibit = {
  asset: string;
  name: string;
};

const packExhibits: PackExhibit[] = [
  { asset: 'admiralty-anchor-bd6882', name: 'Admiralty Anchor' },
  { asset: 'broad-algae-frond-88a644', name: 'Broad Algae Frond' },
  { asset: 'clay-amphora-098d94', name: 'Clay Amphora' },
  { asset: 'rubble-scatter-decal-61332b', name: 'Rubble Scatter' },
  { asset: 'coral-rubble-seabed-tile-772a1f', name: 'Coral Rubble Tile' },
  { asset: 'dive-marker-buoy-21beb7', name: 'Dive Marker Buoy' },
  { asset: 'pillar-coral-b6deba', name: 'Pillar Coral' },
  { asset: 'sea-urchin-b599d4', name: 'Sea Urchin' },
  { asset: 'sea-whip-e56668', name: 'Sea Whip' },
  { asset: 'seagrass-tuft-862cc5', name: 'Seagrass Tuft' },
  { asset: 'small-reef-rock-99062d', name: 'Small Reef Rock' },
  { asset: 'staghorn-coral-422d23', name: 'Staghorn Coral' },
  { asset: 'table-coral-193fa6', name: 'Table Coral' },
];

const packPositions = packExhibits.map((_, index) => [
  -13 + (index % 5) * 3.5,
  0,
  -4 + Math.floor(index / 5) * 4,
] as [number, number, number]);

const generatedPositions = Array.from({ length: 12 }, (_, index) => [
  4 + (index % 4) * 3.5,
  0,
  -4 + Math.floor(index / 4) * 4,
] as [number, number, number]);

export function AssetZooPage() {
  const [reefHealth, setReefHealth] = useState(0.88);

  return (
    <main className="zoo-page">
      <AssetZooScene reefHealth={reefHealth} />
      <header className="zoo-hud">
        <a className="zoo-back-link" href="/">
          <ArrowLeft aria-hidden="true" />
          Aquarium
        </a>
        <section className="zoo-title-card" aria-labelledby="zoo-title">
          <div className="zoo-eyebrow">
            <Boxes aria-hidden="true" />
            Asset provenance playground
          </div>
          <h1 id="zoo-title">The Reef Zoo</h1>
          <p>Every visible specimen is labeled by where it came from.</p>
          <div className="zoo-legend" aria-label="Asset source legend">
            <span className="is-pack"><i aria-hidden="true" />13 free pack assets</span>
            <span className="is-generated"><i aria-hidden="true" />12 generated here</span>
          </div>
        </section>
        <label className="zoo-health-control">
          <Sprout aria-hidden="true" />
          <span>Reef health <strong>{Math.round(reefHealth * 100)}%</strong></span>
          <input
            aria-label="Zoo reef health"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={reefHealth}
            onChange={(event) => setReefHealth(Number(event.target.value))}
          />
        </label>
      </header>
      <div className="zoo-help">
        <MousePointer2 aria-hidden="true" />
        <span>Drag to orbit · scroll to zoom · right-drag to pan</span>
      </div>
    </main>
  );
}

function AssetZooScene({ reefHealth }: { reefHealth: number }) {
  const background = useMemo(
    () => new THREE.Color('#061822').lerp(new THREE.Color('#0c3c47'), reefHealth),
    [reefHealth],
  );

  return (
    <Canvas
      className="zoo-canvas"
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows
    >
      <color attach="background" args={[background]} />
      <fog attach="fog" args={['#103c48', 30, 54]} />
      <PerspectiveCamera makeDefault position={[0.7, 20, 28]} fov={47} />
      <OrbitControls
        makeDefault
        target={[0.7, 0.2, 0]}
        enableDamping
        dampingFactor={0.07}
        minDistance={7}
        maxDistance={48}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI * 0.48}
      />
      <ambientLight intensity={1.25} color="#c5f6ff" />
      <hemisphereLight intensity={2.1} color="#e7ffff" groundColor="#104b52" />
      <directionalLight
        castShadow
        position={[-8, 18, 11]}
        intensity={3.4}
        color="#e6feff"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-7, 5, 1]} intensity={18} color="#50dbe7" distance={22} />
      <pointLight position={[10, 5, 1]} intensity={18} color="#ff947b" distance={22} />
      <ReefShaderProvider health={reefHealth} paused={false}>
        <Suspense fallback={<ZooLoadingLabel />}>
          <ZooFloor />
          <SectionMarker
            color="#65e8f2"
            position={[-6, 0, -7]}
            source="FREE POLYFORK PACK"
            title="Collected specimens"
          />
          <SectionMarker
            color="#ff927a"
            position={[9.2, 0, -7]}
            source="GENERATED IN THIS APP"
            title="Code-grown habitat"
          />
          {packExhibits.map((exhibit, index) => (
            <Exhibit key={exhibit.asset} name={exhibit.name} position={packPositions[index]} source="pack">
              <NormalizedPackAsset asset={exhibit.asset} />
            </Exhibit>
          ))}
          {fishSpecies.map((species, index) => (
            <Exhibit
              key={species.id}
              name={species.displayName}
              position={generatedPositions[index]}
              source="generated"
            >
              <group position={[0, 1.05, 0]} rotation={[0, 0, 0]} scale={1.22}>
                <ProceduralCreature paused={false} phase={index * 0.8} species={species.id as SpeciesId} />
              </group>
            </Exhibit>
          ))}
          <Exhibit name="Reef Terrain" position={generatedPositions[7]} source="generated">
            <GeneratedTerrain />
          </Exhibit>
          <Exhibit name="Swim-through Arch" position={generatedPositions[8]} source="generated">
            <GeneratedArch />
          </Exhibit>
          <Exhibit name="Branch Coral" position={generatedPositions[9]} source="generated">
            <GeneratedBranchCoral />
          </Exhibit>
          <Exhibit name="Sponge Garden" position={generatedPositions[10]} source="generated">
            <GeneratedSponges />
          </Exhibit>
          <Exhibit name="Caustic Reef Shader" position={generatedPositions[11]} source="generated">
            <ShaderSwatch />
          </Exhibit>
          <DustMotes />
        </Suspense>
      </ReefShaderProvider>
    </Canvas>
  );
}

function Exhibit({
  children,
  name,
  position,
  source,
}: {
  children: ReactNode;
  name: string;
  position: [number, number, number];
  source: ExhibitSource;
}) {
  const accent = source === 'pack' ? '#65e8f2' : '#ff927a';

  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.42, 1.55, 0.22, 20]} />
        <ReefMaterial color={source === 'pack' ? '#1a6871' : '#834d48'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.23, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.16, 0.035, 6, 28]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      {children}
      <Html position={[0, -0.03, 1.72]} center zIndexRange={[20, 0]}>
        <div className={`zoo-specimen-label is-${source}`}>
          <span>{source === 'pack' ? 'Free pack' : 'Generated'}</span>
          <strong>{name}</strong>
        </div>
      </Html>
    </group>
  );
}

function NormalizedPackAsset({ asset }: { asset: string }) {
  const uniforms = useReefUniforms();
  const gltf = useLoader(GLTFLoader, `${POLYFORK_CDN}/${asset}.glb`);
  const object = useMemo(() => {
    const clone = cloneWithReefLook(gltf.scene, uniforms);
    clone.updateMatrixWorld(true);
    const initialBounds = new THREE.Box3().setFromObject(clone);
    const size = initialBounds.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
    clone.scale.multiplyScalar(1.85 / maxDimension);
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y += 0.3 - bounds.min.y;
    return clone;
  }, [gltf.scene, uniforms]);

  return <primitive object={object} />;
}

function ZooFloor() {
  return (
    <group>
      <mesh position={[-6, -0.13, 0]} receiveShadow>
        <boxGeometry args={[18.5, 0.18, 14.5]} />
        <ReefMaterial color="#0d3e47" roughness={0.96} />
      </mesh>
      <mesh position={[9.2, -0.13, 0]} receiveShadow>
        <boxGeometry args={[14.5, 0.18, 14.5]} />
        <ReefMaterial color="#493c3b" roughness={0.96} />
      </mesh>
      <gridHelper args={[34, 34, '#37949e', '#173f46']} position={[0.5, -0.02, 0]} />
    </group>
  );
}

function SectionMarker({
  color,
  position,
  source,
  title,
}: {
  color: string;
  position: [number, number, number];
  source: string;
  title: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[8, 1.3, 0.14]} />
        <meshStandardMaterial color="#092630" emissive={color} emissiveIntensity={0.08} roughness={0.86} />
      </mesh>
      <Html position={[0, 0.68, 0.1]} center zIndexRange={[30, 21]}>
        <div className="zoo-section-label" style={{ '--zoo-accent': color } as React.CSSProperties}>
          <span>{source}</span>
          <strong>{title}</strong>
        </div>
      </Html>
    </group>
  );
}

function GeneratedTerrain() {
  return (
    <group position={[0, 0.55, 0]}>
      {[
        [-0.68, 0.12, 0.18, 0.72],
        [0.02, 0.2, 0, 0.92],
        [0.7, 0.1, 0.22, 0.62],
        [-0.18, 0.02, -0.52, 0.54],
      ].map(([x, y, z, scale], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[index * 0.3, index, 0]} scale={scale}>
          <dodecahedronGeometry args={[0.72, 0]} />
          <ReefMaterial color={index % 2 ? '#846e55' : '#6f6650'} roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

function GeneratedArch() {
  return (
    <group position={[0, 0.28, 0]}>
      <mesh position={[0, 0.92, 0]} rotation={[0, 0, 0]} scale={[1.2, 1.2, 0.72]}>
        <torusGeometry args={[0.76, 0.2, 8, 20, Math.PI]} />
        <ReefMaterial color="#7e6650" roughness={0.95} />
      </mesh>
      {[-0.91, 0.91].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]} scale={[0.32, 0.7, 0.32]}>
          <dodecahedronGeometry args={[0.72, 0]} />
          <ReefMaterial color="#7e6650" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function GeneratedBranchCoral() {
  const branches = [
    [0, 0.8, 0, 0],
    [-0.28, 1.12, 0, -0.55],
    [0.3, 1.2, 0.08, 0.62],
    [-0.5, 1.46, 0.04, -0.78],
    [0.53, 1.5, -0.04, 0.72],
  ];

  return (
    <group position={[0, 0.23, 0]}>
      {branches.map(([x, y, z, rotation], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[0, 0, rotation]}>
          <cylinderGeometry args={[0.09, 0.15, index === 0 ? 1.45 : 0.82, 8]} />
          <ReefMaterial color={index % 2 ? '#ed8b72' : '#c76968'} />
        </mesh>
      ))}
    </group>
  );
}

function GeneratedSponges() {
  return (
    <group position={[0, 0.25, 0]}>
      {[
        [-0.52, 0.55, 0.08, 0.42, 1.08],
        [0.03, 0.78, -0.1, 0.48, 1.52],
        [0.58, 0.48, 0.12, 0.34, 0.9],
      ].map(([x, y, z, radius, height], index) => (
        <mesh key={index} position={[x, y, z]}>
          <cylinderGeometry args={[radius * 0.72, radius, height, 10, 1, true]} />
          <ReefMaterial color={index === 1 ? '#d78e55' : '#d0a34e'} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function ShaderSwatch() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.35;
  });

  return (
    <group ref={group} position={[0, 1.03, 0]}>
      <mesh castShadow>
        <icosahedronGeometry args={[0.88, 4]} />
        <ReefMaterial color="#5fbea9" metalness={0.08} roughness={0.58} />
      </mesh>
      <mesh rotation={[Math.PI / 2.7, 0.2, 0]}>
        <torusGeometry args={[1.15, 0.035, 6, 48]} />
        <meshBasicMaterial color="#a6fff0" transparent opacity={0.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

function DustMotes() {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(360 * 3);
    for (let index = 0; index < 360; index += 1) {
      values[index * 3] = -17 + ((index * 43) % 360) / 360 * 35;
      values[index * 3 + 1] = 0.25 + ((index * 29) % 100) / 100 * 8;
      values[index * 3 + 2] = -8 + ((index * 71) % 200) / 200 * 17;
    }
    return values;
  }, []);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.008;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d8fcff" size={0.035} transparent opacity={0.3} depthWrite={false} />
    </points>
  );
}

function ZooLoadingLabel() {
  return (
    <Html center>
      <div className="loader">Opening the specimen crates</div>
    </Html>
  );
}
