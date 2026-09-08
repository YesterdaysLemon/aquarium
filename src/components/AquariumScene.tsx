import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMode, Quality } from '../App';
import { environmentColliders } from '../collision';
import type { SpeciesId } from '../fishSpecies';
import { BottomFog, LightRays } from './AtmosphereEffects';
import { FishSchool, type FollowTarget } from './FishSchool';
import { WaterEffects } from './WaterEffects';
import { swayKelp, underwaterMaterial } from '../underwaterShading';

type Props = {
  quality: Quality;
  paused: boolean;
  showHitboxes: boolean;
  cameraMode: CameraMode;
  cameraResetKey: number;
  followFishIndex: number;
  selectedSpecies: SpeciesId;
  zoom: number;
  onZoomChange: (factor: number) => void;
};

const environmentPath = '/assets/environment/underwater-environment.glb';
const hiddenEnvironmentMeshes = new Set(['Object1040']);

export function AquariumScene({
  quality,
  paused,
  showHitboxes,
  cameraMode,
  cameraResetKey,
  followFishIndex,
  selectedSpecies,
  zoom,
  onZoomChange,
}: Props) {
  const followTarget = useRef<FollowTarget>({
    position: new THREE.Vector3(0, 1, 15),
    velocity: new THREE.Vector3(1, 0, 0),
  });

  return (
    <Canvas
      className="aquarium-canvas"
      dpr={quality === 'high' ? [1, 1.5] : [0.75, 1]}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }}
      shadows={quality === 'high'}
    >
      <color attach="background" args={['#041c2c']} />
      <fog attach="fog" args={['#08314a', 16, 76]} />
      <PerspectiveCamera makeDefault position={[0, 12, 40]} fov={46} />
      <CameraRig mode={cameraMode} resetKey={cameraResetKey} followTarget={followTarget} zoom={zoom} onZoomChange={onZoomChange} />
      <ambientLight intensity={0.32} color="#9acbd9" />
      <hemisphereLight intensity={1.65} color="#d5f3ef" groundColor="#173942" />
      <directionalLight
        position={[-10, 18, -12]}
        intensity={3.4}
        color="#fff0cd"
        castShadow={quality === 'high'}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={26}
        shadow-camera-bottom={-24}
        shadow-camera-far={85}
        shadow-normalBias={0.06}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[12, 8, 20]} intensity={1.2} color="#8dcfdf" />
      <pointLight position={[8, 6, -10]} intensity={7} color="#31b7d7" distance={38} />
      <pointLight position={[-6, 2, 7]} intensity={3.5} color="#79efcf" distance={22} />
      <spotLight
        position={[-11, 16, -13]}
        target-position={[3, -2, 1]}
        angle={0.5}
        penumbra={0.9}
        intensity={4.2}
        color="#d6fbff"
        distance={38}
      />
      <Suspense fallback={<LoadingLabel />}>
        <OceanVolume />
        <LightRays paused={paused} quality={quality} />
        <BottomFog />
        <EnvironmentAnchor />
        <FishSchool
          quality={quality}
          paused={paused}
          showHitboxes={showHitboxes}
          followTarget={followTarget}
          followFishIndex={followFishIndex}
          selectedSpecies={selectedSpecies}
        />
        {showHitboxes ? <EnvironmentHitboxes /> : null}
        <MarineSnow quality={quality} paused={paused} />
        <Bubbles quality={quality} paused={paused} />
        <WaterEffects paused={paused} />
      </Suspense>
    </Canvas>
  );
}

function CameraRig({
  mode,
  resetKey,
  followTarget,
  zoom,
  onZoomChange,
}: {
  mode: CameraMode;
  resetKey: number;
  followTarget: RefObject<FollowTarget>;
  zoom: number;
  onZoomChange: (factor: number) => void;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();
  const desiredPosition = useRef(new THREE.Vector3());
  const desiredLookAt = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const outward = useRef(new THREE.Vector3());
  const lateral = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));
  const followLookOffset = useRef(new THREE.Vector3(0, 0.22, 0));

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Aquarium view. Scroll, pinch, or use plus and minus to zoom.');
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchDistance = 0;
    const distance = () => { const points = [...pointers.values()]; return points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0; };
    const down = (event: PointerEvent) => { pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); pinchDistance = distance(); };
    const move = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const next = distance();
      if (next > 8 && pinchDistance > 8) onZoomChange(next / pinchDistance);
      pinchDistance = next;
    };
    const up = (event: PointerEvent) => { pointers.delete(event.pointerId); pinchDistance = distance(); };
    const wheel = (event: WheelEvent) => { event.preventDefault(); onZoomChange(Math.exp(-Math.max(-180, Math.min(180, event.deltaY * (event.deltaMode === 1 ? 16 : 1))) * .002)); };
    const key = (event: KeyboardEvent) => {
      if (['+', '=', '-', '_'].includes(event.key)) { event.preventDefault(); onZoomChange(event.key === '+' || event.key === '=' ? 1.2 : 1 / 1.2); }
    };
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('lostpointercapture', up); canvas.addEventListener('keydown', key);
    return () => {
      canvas.removeEventListener('wheel', wheel); canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('lostpointercapture', up);
      canvas.removeEventListener('keydown', key);
    };
  }, [gl, onZoomChange]);

  useEffect(() => {
    if (mode === 'overview') {
      camera.position.set(0, 12, 40);
      controls.current?.target.set(0, 3, 0);
      controls.current?.update();
    }
  }, [camera, mode, resetKey]);

  useFrame((_, delta) => {
    if (camera instanceof THREE.PerspectiveCamera && camera.zoom !== zoom) {
      camera.zoom = THREE.MathUtils.lerp(camera.zoom, zoom, 1 - Math.exp(-Math.min(delta, .1) * 12));
      if (Math.abs(camera.zoom - zoom) < .0001) camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
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

    lateral.current.crossVectors(outward.current, up.current);
    if (lateral.current.dot(forward.current) < 0) {
      lateral.current.multiplyScalar(-1);
    }
    lateral.current.normalize();

    const targetRadius = Math.max(Math.hypot(target.position.x, target.position.z), 0.001);
    const cameraRadius = Math.max(targetRadius + 7.5 + (target.size ?? 1) * 1.3, 23);
    desiredPosition.current
      .set(outward.current.x * cameraRadius, target.position.y + 1.2, outward.current.z * cameraRadius)
      .addScaledVector(lateral.current, -1.8);

    const constrainedRadius = Math.max(Math.hypot(desiredPosition.current.x, desiredPosition.current.z), 0.001);
    if (constrainedRadius < 23) {
      desiredPosition.current.x = (desiredPosition.current.x / constrainedRadius) * 23;
      desiredPosition.current.z = (desiredPosition.current.z / constrainedRadius) * 23;
    }

    desiredLookAt.current
      .copy(target.position)
      .addScaledVector(lateral.current, 0.45)
      .add(followLookOffset.current);

    camera.position.lerp(desiredPosition.current, 1 - Math.pow(0.001, delta));
    camera.lookAt(desiredLookAt.current);
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={mode === 'overview'}
      enableZoom={false}
      enablePan={false}
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
        if (hiddenEnvironmentMeshes.has(object.name)) {
          object.visible = false;
          return;
        }

        object.castShadow = true;
        object.receiveShadow = true;
        object.material = Array.isArray(object.material) ? object.material.map(m => m.clone()) : object.material.clone();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
            material.emissive = new THREE.Color('#07323b');
            material.emissiveIntensity = 0.08;
            material.roughness = Math.min(1, material.roughness + 0.08);
            if (object.name === 'Object1035') swayKelp(material);
            underwaterMaterial(material);
          }
        }
        if (object.name === 'Object1035') {
          object.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
          swayKelp(object.customDepthMaterial);
        }
      }
    });
    return clone;
  }, [gltf]);

  useEffect(() => () => scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => material.dispose());
      object.customDepthMaterial?.dispose();
    }
  }), [scene]);

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
      <mesh position={[0, -10.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[32, 128]} />
        <meshBasicMaterial color="#031724" transparent opacity={0.32} depthWrite={false} />
      </mesh>
    </group>
  );
}

function MarineSnow({ quality, paused }: { quality: Quality; paused: boolean }) {
  const points = useRef<THREE.Points>(null);
  const count = quality === 'high' ? 560 : 220;
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.618;
      const radius = 4 + ((index * 53) % 100) / 100 * 27;
      data[index * 3] = Math.cos(angle) * radius;
      data[index * 3 + 1] = -8.2 + ((index * 31) % 100) / 100 * 17;
      data[index * 3 + 2] = Math.sin(angle) * radius;
    }
    return data;
  }, [count]);

  useFrame((_, delta) => {
    if (paused || !points.current) return;

    const position = points.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let index = 0; index < count; index += 1) {
      const xIndex = index * 3;
      const yIndex = xIndex + 1;
      position.array[xIndex] = (position.array[xIndex] as number) + Math.sin(index * 0.73) * delta * 0.018;
      position.array[yIndex] = (position.array[yIndex] as number) - delta * (0.015 + (index % 5) * 0.004);
      if ((position.array[yIndex] as number) < -8.6) position.array[yIndex] = 9.2;
    }
    position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#d8faff" transparent opacity={0.28} depthWrite={false} />
    </points>
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
