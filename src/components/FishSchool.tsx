import { useFrame, useLoader } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import type { Quality } from '../App';
import type { SpeciesId } from '../fishSpecies';
import { animateFishMaterial, swimUniforms, swimRate } from '../swimAnimation';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { fishSpecies } from '../fishSpecies';
import { createAgents, selectFollowFish, stepSchool, type FishAgentState } from '../schoolSimulation';
import { underwaterMaterial } from '../underwaterShading';

type Props = { quality: Quality; paused: boolean; showHitboxes: boolean;
  followTarget: RefObject<FollowTarget>; followFishIndex: number; selectedSpecies: SpeciesId };
export type FollowTarget = { position: THREE.Vector3; velocity: THREE.Vector3; size?: number };

export function FishSchool({ quality, paused, showHitboxes, followTarget, followFishIndex, selectedSpecies }: Props) {
  const agents = useMemo(() => createAgents(quality === 'high'), [quality]);
  const target = useMemo(() => selectFollowFish(agents, selectedSpecies, followFishIndex), [agents, selectedSpecies, followFishIndex]);
  const simulation = useRef({ time: 0, remainder: 0 });
  const models = useLoader(GLTFLoader, fishSpecies.map(species => `/assets/living-fish/${species.id}.glb`));
  const geometry = useMemo(() => new Map(models.map((model, index) => {
    let mesh: THREE.Mesh | undefined;
    model.scene.traverse(object => { if (object instanceof THREE.Mesh) mesh = object; });
    if (!mesh) throw new Error(`Missing mesh for ${fishSpecies[index].id}`);
    return [fishSpecies[index].id, mesh.geometry] as const;
  })), [models]);
  useFrame((_, delta) => {
    if (!paused && !document.hidden) {
      simulation.current.remainder += Math.min(delta, .1);
      while (simulation.current.remainder >= 1 / 60) {
        simulation.current.time += 1 / 60;
        stepSchool(agents, 1 / 60, simulation.current.time);
        simulation.current.remainder -= 1 / 60;
      }
    }
    if (target && followTarget.current) {
      followTarget.current.position.copy(target.position);
      followTarget.current.velocity.copy(target.velocity);
      followTarget.current.size = target.scale;
    }
  });
  return <group>{agents.map(agent => <Fish key={agent.id} agent={agent} geometry={geometry.get(agent.species)!}
    paused={paused} showHitboxes={showHitboxes} />)}</group>;
}

function Fish({ agent, geometry, paused, showHitboxes }: {
  agent: FishAgentState; geometry: THREE.BufferGeometry; paused: boolean; showHitboxes: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const state = useMemo(() => {
    const uniforms = swimUniforms(); uniforms.time.value = agent.phase;
    const material = new THREE.MeshPhysicalMaterial({ vertexColors: true,
      roughness: agent.species === 'puffer' ? .58 : agent.species === 'shark' ? .48 : .42,
      metalness: agent.species === 'puffer' ? .02 : .08,
      clearcoat: agent.species === 'puffer' ? .10 : .24, clearcoatRoughness: .32, side: THREE.DoubleSide });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
    animateFishMaterial(material, uniforms, agent.species); animateFishMaterial(depth, uniforms, agent.species);
    underwaterMaterial(material);
    return { uniforms, material, depth, look: new THREE.Matrix4(), rotation: new THREE.Quaternion(),
      origin: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), direction: agent.velocity.clone().normalize() };
  }, [agent]);
  useEffect(() => () => { state.material.dispose(); state.depth.dispose(); }, [state]);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.position.copy(agent.position);
    if (paused || document.hidden) return;
    const dt = Math.min(delta, .1);
    state.uniforms.time.value += dt * swimRate(agent.species, agent.effort);
    state.uniforms.effort.value = agent.effort;
    const turn = state.direction.x * agent.velocity.z - state.direction.z * agent.velocity.x;
    state.up.set(THREE.MathUtils.clamp(turn * .6, -.25, .25), 1, 0).normalize();
    state.look.lookAt(agent.velocity, state.origin, state.up);
    state.rotation.setFromRotationMatrix(state.look);
    mesh.current.quaternion.slerp(state.rotation, 1 - Math.exp(-dt * 7));
    state.direction.copy(agent.velocity).normalize();
  });
  return <mesh ref={mesh} geometry={geometry} material={state.material} customDepthMaterial={state.depth}
    scale={agent.scale} castShadow receiveShadow>
    {showHitboxes && <mesh><sphereGeometry args={[agent.hitRadius / agent.scale, 12, 8]} />
      <meshBasicMaterial color="#ff8eb6" wireframe transparent opacity={.3} /></mesh>}
  </mesh>;
}
