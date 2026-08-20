import { useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { SpeciesId } from '../fishSpecies';
import { cloneSkinnedWithReefLook, useReefUniforms } from './ReefShader';

const creatureModels: Record<SpeciesId, { healthyClip: string; lowHealthClip: string; targetSize: number; url: string }> = {
  emberFish: {
    healthyClip: 'cruise',
    lowHealthClip: 'idle',
    targetSize: 1.9,
    url: '/assets/creatures/ember-fish-v2.glb',
  },
  lagoonTang: {
    healthyClip: 'cruise',
    lowHealthClip: 'idle',
    targetSize: 2.0,
    url: '/assets/creatures/lagoon-tang-v2.glb',
  },
  sunfinTang: {
    healthyClip: 'cruise',
    lowHealthClip: 'idle',
    targetSize: 2.0,
    url: '/assets/creatures/sunfin-tang-v2.glb',
  },
  reefGrouper: {
    healthyClip: 'cruise',
    lowHealthClip: 'idle',
    targetSize: 2.15,
    url: '/assets/creatures/reef-grouper-v2.glb',
  },
  moonJelly: {
    healthyClip: 'pulse',
    lowHealthClip: 'drift',
    targetSize: 1.85,
    url: '/assets/creatures/moon-jelly-v2.glb',
  },
  seaTurtle: {
    healthyClip: 'cruise',
    lowHealthClip: 'glide',
    targetSize: 2.15,
    url: '/assets/creatures/sea-turtle-v1.glb',
  },
  reefShark: {
    healthyClip: 'cruise',
    lowHealthClip: 'idle',
    targetSize: 2.55,
    url: '/assets/creatures/reef-shark-v3.glb',
  },
};

function AnyCreatureModel({
  clip,
  modelUrl,
  paused,
  phase,
  targetSize,
}: {
  clip: string;
  modelUrl: string;
  paused: boolean;
  phase: number;
  targetSize: number;
}) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const uniforms = useReefUniforms();
  const object = useMemo(() => {
    const clone = cloneSkinnedWithReefLook(gltf.scene, uniforms);
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
    clone.scale.multiplyScalar(targetSize / maxDimension);
    clone.updateMatrixWorld(true);
    const normalizedBounds = new THREE.Box3().setFromObject(clone);
    const center = normalizedBounds.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    return clone;
  }, [gltf.scene, targetSize, uniforms]);
  const mixer = useMemo(() => new THREE.AnimationMixer(object), [object]);

  useEffect(() => {
    const animation = THREE.AnimationClip.findByName(gltf.animations, clip) ?? gltf.animations[0];
    if (!animation) return undefined;
    const action = mixer.clipAction(animation);
    action.reset();
    action.time = phase % animation.duration;
    action.fadeIn(0.16).play();
    return () => {
      action.fadeOut(0.1);
      mixer.stopAllAction();
      mixer.uncacheRoot(object);
    };
  }, [clip, gltf.animations, mixer, object, phase]);

  useFrame((_, delta) => {
    if (!paused) mixer.update(delta);
  });

  return <primitive object={object} />;
}

export function AnyCreatureCollectionCreature({
  health,
  paused,
  phase,
  species,
}: {
  health: number;
  paused: boolean;
  phase: number;
  species: SpeciesId;
}) {
  const model = creatureModels[species];
  return (
    <AnyCreatureModel
      clip={health > 0.4 ? model.healthyClip : model.lowHealthClip}
      modelUrl={model.url}
      paused={paused}
      phase={phase}
      targetSize={model.targetSize}
    />
  );
}

Object.values(creatureModels).forEach(({ url }) => useLoader.preload(GLTFLoader, url));
