import { Html, OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMode, Quality } from '../App';
import { environmentColliders } from '../collision';
import { BottomFog, LightRays } from './AtmosphereEffects';
import { FishSchool, type FollowTarget } from './FishSchool';

type Props = {
  quality: Quality;
  paused: boolean;
  showHitboxes: boolean;
  cameraMode: CameraMode;
  cameraResetKey: number;
};

const environmentPath = '/assets/environment/underwater-environment.glb';

export function AquariumScene({ quality, paused, showHitboxes, cameraMode, cameraResetKey }: Props) {
  const followTarget = useRef<FollowTarget>({
    position: new THREE.Vector3(0, 1, 15),
    velocity: new THREE.Vector3(1, 0, 0),
  });

  return (
    <Canvas
      className="aquarium-canvas"
      dpr={quality === 'high' ? [1, 1.5] : [0.75, 1]}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance' }}
      shadows={quality === 'high'}
    >
      <color attach="background" args={['#041c2c']} />
      <fog attach="fog" args={['#08314a', 10, 64]} />
      <PerspectiveCamera makeDefault position={[0, 12, 40]} fov={46} />
      <CameraRig mode={cameraMode} resetKey={cameraResetKey} followTarget={followTarget} />
      <ambientLight intensity={0.9} color="#b4efff" />
      <hemisphereLight intensity={1.4} color="#dffcff" groundColor="#0d5361" />
      <directionalLight
        position={[-8, 17, 10]}
        intensity={3.4}
        color="#d6fbff"
        castShadow={quality === 'high'}
      />
      <pointLight position={[8, 6, -10]} intensity={7} color="#31b7d7" distance={38} />
      <pointLight position={[-6, 2, 7]} intensity={3.5} color="#79efcf" distance={22} />
      <spotLight
        position={[0, 10, 16]}
        target-position={[0, -1, 0]}
        angle={0.44}
        penumbra={0.8}
        intensity={5}
        color="#d6fbff"
        distance={38}
      />
      <Suspense fallback={<LoadingLabel />}>
        <OceanVolume />
        <LightRays />
        <BottomFog />
        <EnvironmentAnchor />
        <FishSchool
          quality={quality}
          paused={paused}
          showHitboxes={showHitboxes}
          followTarget={followTarget}
        />
        {showHitboxes ? <EnvironmentHitboxes /> : null}
        <Bubbles quality={quality} paused={paused} />
        <Caustics paused={paused} />
      </Suspense>
      {quality === 'high' ? <Stars radius={86} depth={24} count={520} factor={1.5} fade speed={0.25} /> : null}
    </Canvas>
  );
}

function CameraRig({
  mode,
  resetKey,
  followTarget,
}: {
  mode: CameraMode;
  resetKey: number;
  followTarget: RefObject<FollowTarget>;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const desiredPosition = useRef(new THREE.Vector3());
  const desiredLookAt = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const outward = useRef(new THREE.Vector3());

  useEffect(() => {
    if (mode === 'overview') {
      camera.position.set(0, 12, 40);
      controls.current?.target.set(0, 3, 0);
      controls.current?.update();
    }
  }, [camera, mode, resetKey]);

  useFrame((_, delta) => {
    if (mode !== 'follow' || !followTarget.current) return;

    const target = followTarget.current;
    forward.current.copy(target.velocity);
    if (forward.current.lengthSq() < 0.001) {
      forward.current.set(1, 0, 0);
    }
    forward.current.normalize();

    outward.current.set(target.position.x, 0, target.position.z);
    if (outward.current.lengthSq() < 0.001) {
      outward.current.set(0, 0, 1);
    }
    outward.current.normalize();

    desiredPosition.current
      .copy(target.position)
      .addScaledVector(outward.current, 13)
      .add(new THREE.Vector3(0, 1.7, 0));
    desiredLookAt.current.copy(target.position).addScaledVector(forward.current, 2.2).add(new THREE.Vector3(0, 0.35, 0));

    camera.position.lerp(desiredPosition.current, 1 - Math.pow(0.001, delta));
    camera.lookAt(desiredLookAt.current);
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={mode === 'overview'}
      enableDamping
      dampingFactor={0.08}
      minDistance={18}
      maxDistance={58}
      maxPolarAngle={Math.PI * 0.55}
      minPolarAngle={Math.PI * 0.17}
      target={[0, 3, 0]}
      makeDefault
    />
  );
}

function LoadingLabel() {
  return (
    <Html center>
      <div className="loader">Loading ocean slice</div>
    </Html>
  );
}

function EnvironmentAnchor() {
  const gltf = useLoader(GLTFLoader, environmentPath, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });

  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxAxis = Math.max(size.x, size.y, size.z);
    const scale = maxAxis > 0 ? 42 / maxAxis : 1;
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
            material.emissive = new THREE.Color('#07323b');
            material.emissiveIntensity = 0.08;
            material.roughness = Math.min(1, material.roughness + 0.08);
          }
        }
      }
    });
    return clone;
  }, [gltf]);

  return (
    <group position={[0, -12.4, 0]} rotation={[0, -0.35, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function EnvironmentHitboxes() {
  return (
    <group>
      {environmentColliders.map((collider) =>
        collider.kind === 'sphere' ? (
          <mesh key={collider.id} position={collider.center}>
            <sphereGeometry args={[collider.radius, 24, 16]} />
            <meshBasicMaterial color="#7df9ff" transparent opacity={0.16} wireframe depthWrite={false} />
          </mesh>
        ) : (
          <mesh key={collider.id} position={collider.center}>
            <boxGeometry args={[collider.size.x, collider.size.y, collider.size.z]} />
            <meshBasicMaterial color="#ffd166" transparent opacity={0.22} wireframe depthWrite={false} />
          </mesh>
        ),
      )}
    </group>
  );
}

function OceanVolume() {
  return (
    <group>
      <mesh position={[0, -7.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[32, 128]} />
        <meshBasicMaterial color="#031724" transparent opacity={0.72} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Bubbles({ quality, paused }: { quality: Quality; paused: boolean }) {
  const points = useRef<THREE.Points>(null);
  const count = quality === 'high' ? 220 : 90;
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399;
      const radius = 3 + ((index * 29) % 100) / 100 * 20;
      data[index * 3] = Math.cos(angle) * radius;
      data[index * 3 + 1] = -4.5 + ((index * 37) % 100) / 100 * 13.2;
      data[index * 3 + 2] = Math.sin(angle) * radius;
    }
    return data;
  }, [count]);

  useFrame((_, delta) => {
    if (paused || !points.current) return;
    const position = points.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let index = 0; index < count; index += 1) {
      const yIndex = index * 3 + 1;
      position.array[yIndex] = ((position.array[yIndex] as number) + delta * (0.35 + (index % 5) * 0.05));
      if ((position.array[yIndex] as number) > 9) position.array[yIndex] = -4.5;
    }
    position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.055} color="#bff8ff" transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

function Caustics({ paused }: { paused: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (paused || !ref.current) return;
    ref.current.rotation.z = clock.elapsedTime * 0.08;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.13 + Math.sin(clock.elapsedTime * 0.8) * 0.035;
  });

  return (
    <mesh ref={ref} position={[0, -5.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[4, 22, 128, 8]} />
      <meshBasicMaterial color="#bff7ff" transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}
