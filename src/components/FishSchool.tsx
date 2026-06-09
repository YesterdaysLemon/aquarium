import { useFrame, useLoader } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Quality } from '../App';
import { environmentColliders, getColliderAvoidance } from '../collision';

type Props = {
  quality: Quality;
  paused: boolean;
  showHitboxes: boolean;
  followTarget: RefObject<FollowTarget>;
};

export type FollowTarget = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
};

type Agent = {
  id: number;
  species: SpeciesId;
  model: string;
  schooling: boolean;
  predator: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  desiredDepth: number;
  orbitRadius: number;
  baseSpeed: number;
  speedVariation: number;
  speedPhase: number;
  speedPulse: number;
  scale: number;
  hitRadius: number;
  phase: number;
};

type SpeciesId = 'clownfish' | 'blueTang' | 'yellowTang' | 'goldfish' | 'koi' | 'puffer' | 'shark';

type SpeciesConfig = {
  model: string;
  schooling: boolean;
  predator: boolean;
  scale: number;
  hitRadiusScale: number;
  baseSpeed: number;
  speedVariation: number;
  preferredRadius: number;
};

const speciesConfigs: Record<SpeciesId, SpeciesConfig> = {
  clownfish: {
    model: '/assets/fish/Clownfish.glb',
    schooling: true,
    predator: false,
    scale: 0.58,
    hitRadiusScale: 0.58,
    baseSpeed: 1.18,
    speedVariation: 0.22,
    preferredRadius: 14.5,
  },
  blueTang: {
    model: '/assets/fish/BlueTang.glb',
    schooling: true,
    predator: false,
    scale: 0.62,
    hitRadiusScale: 0.56,
    baseSpeed: 1.28,
    speedVariation: 0.28,
    preferredRadius: 17,
  },
  yellowTang: {
    model: '/assets/fish/YellowTang.glb',
    schooling: true,
    predator: false,
    scale: 0.58,
    hitRadiusScale: 0.56,
    baseSpeed: 1.32,
    speedVariation: 0.3,
    preferredRadius: 19,
  },
  goldfish: {
    model: '/assets/fish/Goldfish.glb',
    schooling: false,
    predator: false,
    scale: 0.72,
    hitRadiusScale: 0.56,
    baseSpeed: 0.92,
    speedVariation: 0.26,
    preferredRadius: 13,
  },
  koi: {
    model: '/assets/fish/Koi.glb',
    schooling: false,
    predator: false,
    scale: 0.82,
    hitRadiusScale: 0.56,
    baseSpeed: 0.86,
    speedVariation: 0.22,
    preferredRadius: 15,
  },
  puffer: {
    model: '/assets/fish/Puffer.glb',
    schooling: false,
    predator: false,
    scale: 0.7,
    hitRadiusScale: 0.62,
    baseSpeed: 0.72,
    speedVariation: 0.2,
    preferredRadius: 12.5,
  },
  shark: {
    model: '/assets/fish/Shark.glb',
    schooling: false,
    predator: true,
    scale: 1.85,
    hitRadiusScale: 0.62,
    baseSpeed: 1.18,
    speedVariation: 0.2,
    preferredRadius: 22,
  },
};

export function FishSchool({ quality, paused, showHitboxes, followTarget }: Props) {
  const count = quality === 'high' ? 28 : 14;
  const agents = useMemo(() => createAgents(count), [count]);

  useFrame(({ clock }, delta) => {
    if (paused) return;
    stepSchool(agents, Math.min(delta, 0.033), clock.elapsedTime);
    updateFollowTarget(agents, followTarget);
  });

  return (
    <group>
      {agents.map((agent) => (
        <FishAgent key={agent.id} agent={agent} showHitboxes={showHitboxes} />
      ))}
    </group>
  );
}

function updateFollowTarget(agents: Agent[], followTarget: RefObject<FollowTarget>) {
  if (!followTarget.current) return;

  const school = agents.filter((agent) => agent.species === 'blueTang');
  const targetAgents = school.length >= 2 ? school : agents.filter((agent) => agent.schooling);
  if (targetAgents.length === 0) return;

  followTarget.current.position.set(0, 0, 0);
  followTarget.current.velocity.set(0, 0, 0);

  for (const agent of targetAgents) {
    followTarget.current.position.add(agent.position);
    followTarget.current.velocity.add(agent.velocity);
  }

  followTarget.current.position.divideScalar(targetAgents.length);
  followTarget.current.velocity.divideScalar(targetAgents.length);
}

function FishAgent({ agent, showHitboxes }: { agent: Agent; showHitboxes: boolean }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, agent.model);
  const object = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxAxis = Math.max(size.x, size.y, size.z);
    const normalizedScale = maxAxis > 0 ? agent.scale / maxAxis : agent.scale;
    clone.scale.setScalar(normalizedScale);
    clone.position.set(
      -center.x * normalizedScale,
      -center.y * normalizedScale,
      -center.z * normalizedScale,
    );
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
      }
    });
    return clone;
  }, [agent.scale, gltf]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.copy(agent.position);

    const lookTarget = agent.position.clone().add(agent.velocity);
    group.current.lookAt(lookTarget);
    group.current.rotateZ(
      THREE.MathUtils.clamp(-agent.velocity.x * 0.08 + Math.sin(clock.elapsedTime * 3 + agent.phase) * 0.04, -0.35, 0.35),
    );
    object.rotation.y = Math.sin(clock.elapsedTime * 8 + agent.phase) * 0.035;
  });

  return (
    <group ref={group}>
      <primitive object={object} />
      {showHitboxes ? (
        <mesh>
          <sphereGeometry args={[agent.hitRadius, 16, 10]} />
          <meshBasicMaterial
            color={agent.predator ? '#ff4d4d' : '#ff6b9a'}
            transparent
            opacity={0.22}
            wireframe
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function createAgents(count: number): Agent[] {
  const species = createSpeciesRoster(count);
  const speciesSeen = new Map<SpeciesId, number>();
  const schoolAngles: Record<SpeciesId, number> = {
    clownfish: -2.5,
    blueTang: -0.6,
    yellowTang: 1.15,
    goldfish: 2.35,
    koi: -1.55,
    puffer: 0.45,
    shark: 2.95,
  };

  return species.map((speciesId, index) => {
    const config = speciesConfigs[speciesId];
    const speciesIndex = speciesSeen.get(speciesId) ?? 0;
    speciesSeen.set(speciesId, speciesIndex + 1);
    const angle = config.schooling
      ? schoolAngles[speciesId] + (speciesIndex - 2) * 0.22 + Math.sin(index) * 0.08
      : schoolAngles[speciesId] + speciesIndex * 0.68 + index * 0.11;
    const orbitRadius = config.preferredRadius + ((index % 5) - 2) * 0.9;
    const depth = -0.8 + (index % 7) * 1.15;
    const position = new THREE.Vector3(
      Math.cos(angle) * orbitRadius,
      depth,
      Math.sin(angle) * orbitRadius,
    );
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
    return {
      id: index,
      species: speciesId,
      model: config.model,
      schooling: config.schooling,
      predator: config.predator,
      position,
      velocity: tangent.multiplyScalar(1.3 + (index % 5) * 0.14),
      desiredDepth: depth,
      orbitRadius,
      baseSpeed: config.baseSpeed + (index % 3) * 0.05,
      speedVariation: config.speedVariation + (index % 5) * 0.025,
      speedPhase: index * 1.37,
      speedPulse: 0.18 + (index % 7) * 0.025,
      scale: config.scale + (config.predator ? 0 : (index % 3) * 0.04),
      hitRadius: config.scale * config.hitRadiusScale,
      phase: index * 0.73,
    };
  });
}

function createSpeciesRoster(count: number): SpeciesId[] {
  const highRoster: SpeciesId[] = [
    'clownfish',
    'clownfish',
    'clownfish',
    'clownfish',
    'clownfish',
    'blueTang',
    'blueTang',
    'blueTang',
    'blueTang',
    'blueTang',
    'yellowTang',
    'yellowTang',
    'yellowTang',
    'yellowTang',
    'goldfish',
    'goldfish',
    'goldfish',
    'koi',
    'koi',
    'puffer',
    'puffer',
    'clownfish',
    'blueTang',
    'yellowTang',
    'goldfish',
    'koi',
    'puffer',
    'shark',
  ];

  const lowRoster: SpeciesId[] = [
    'clownfish',
    'clownfish',
    'clownfish',
    'blueTang',
    'blueTang',
    'yellowTang',
    'yellowTang',
    'goldfish',
    'goldfish',
    'koi',
    'puffer',
    'clownfish',
    'blueTang',
    'shark',
  ];

  return (count > lowRoster.length ? highRoster : lowRoster).slice(0, count);
}

function stepSchool(agents: Agent[], delta: number, time: number) {
  const center = new THREE.Vector3();
  const steer = new THREE.Vector3();
  const separation = new THREE.Vector3();
  const alignment = new THREE.Vector3();
  const cohesion = new THREE.Vector3();
  const predatorAvoidance = new THREE.Vector3();
  const wander = new THREE.Vector3();
  const predators = agents.filter((agent) => agent.predator);

  for (const agent of agents) {
    const radial = new THREE.Vector3(agent.position.x, 0, agent.position.z);
    const radius = Math.max(radial.length(), 0.001);
    const outward = radial.clone().divideScalar(radius);
    const tangent = new THREE.Vector3(-outward.z, 0, outward.x);
    const radiusError = radius - agent.orbitRadius;
    const speedWave =
      Math.sin(time * agent.speedPulse + agent.speedPhase) * agent.speedVariation +
      Math.sin(time * agent.speedPulse * 2.7 + agent.phase) * agent.speedVariation * 0.35;
    const currentSpeed = THREE.MathUtils.clamp(agent.baseSpeed + speedWave, 0.62, 2.25);

    wander
      .set(
        Math.sin(time * 0.27 + agent.phase * 2.1),
        Math.sin(time * 0.19 + agent.phase) * 0.35,
        Math.cos(time * 0.23 + agent.phase * 1.7),
      )
      .normalize()
      .multiplyScalar(agent.predator ? currentSpeed * 0.9 : currentSpeed * 0.55);

    steer.copy(agent.velocity).normalize().multiplyScalar(currentSpeed * 0.5);
    steer.add(wander);
    steer.add(tangent.multiplyScalar(agent.predator ? currentSpeed * 0.18 : currentSpeed * 0.12));
    steer.add(outward.multiplyScalar(-radiusError * 0.28));
    steer.y += (agent.desiredDepth + Math.sin(time * 0.45 + agent.phase) * 0.55 - agent.position.y) * 0.45;

    separation.set(0, 0, 0);
    alignment.set(0, 0, 0);
    cohesion.set(0, 0, 0);
    predatorAvoidance.set(0, 0, 0);
    let sameSpeciesNeighbors = 0;

    for (const other of agents) {
      if (agent === other) continue;
      const distance = agent.position.distanceTo(other.position);
      const sameSpecies = agent.species === other.species;
      const neighborRadius = sameSpecies && agent.schooling ? 7.4 : 3.1;
      if (distance < neighborRadius) {
        const closeness = (neighborRadius - distance) / neighborRadius;
        separation.add(
          agent.position
            .clone()
            .sub(other.position)
            .multiplyScalar(closeness * (sameSpecies && agent.schooling ? 0.42 : 1.25)),
        );
        if (sameSpecies && agent.schooling) {
          alignment.add(other.velocity);
          cohesion.add(other.position);
          sameSpeciesNeighbors += 1;
        }
      }
    }

    if (agent.schooling && sameSpeciesNeighbors > 0) {
      alignment.divideScalar(sameSpeciesNeighbors).normalize().multiplyScalar(0.42);
      cohesion.divideScalar(sameSpeciesNeighbors).sub(agent.position).multiplyScalar(0.07);
      steer.add(separation.multiplyScalar(0.52)).add(alignment).add(cohesion);
    } else {
      steer.add(separation.multiplyScalar(agent.predator ? 0.35 : 0.7));
    }

    if (!agent.predator) {
      for (const predator of predators) {
        const distance = agent.position.distanceTo(predator.position);
        const fearRadius = 11.5 + predator.hitRadius;
        if (distance < fearRadius) {
          predatorAvoidance
            .add(agent.position.clone().sub(predator.position).normalize().multiplyScalar((fearRadius - distance) / fearRadius));
        }
      }
      steer.add(predatorAvoidance.multiplyScalar(agent.schooling ? 3.2 : 2.1));
    } else {
      const nearestPrey = agents
        .filter((other) => !other.predator)
        .sort((a, b) => agent.position.distanceTo(a.position) - agent.position.distanceTo(b.position))[0];
      if (nearestPrey) {
        const toPrey = nearestPrey.position.clone().sub(agent.position);
        if (toPrey.length() < 22) {
          steer.add(toPrey.normalize().multiplyScalar(0.38));
        }
      }
    }

    for (const collider of environmentColliders) {
      const avoidance = getColliderAvoidance(agent.position, collider, agent.hitRadius + 0.9);
      if (avoidance) {
        steer.add(avoidance.normal.multiplyScalar(avoidance.penetration * 2.4));
      }
    }

    if (radius > 30) {
      center.set(-agent.position.x, 0, -agent.position.z).normalize();
      steer.add(center.multiplyScalar((radius - 30) * 2.5));
    }

    steer.x += Math.sin(time * 0.6 + agent.phase) * 0.08;
    steer.z += Math.cos(time * 0.5 + agent.phase) * 0.08;

    agent.velocity.lerp(steer, 0.055).clampLength(0.55, 2.45);
  }

  for (const agent of agents) {
    agent.position.addScaledVector(agent.velocity, delta);

    for (const collider of environmentColliders) {
      const collision = getColliderAvoidance(agent.position, collider, agent.hitRadius);
      if (!collision) continue;

      agent.position.addScaledVector(collision.normal, collision.penetration + 0.01);
      const inwardSpeed = agent.velocity.dot(collision.normal);
      if (inwardSpeed < 0) {
        agent.velocity.addScaledVector(collision.normal, -inwardSpeed * 1.45);
      }
    }

    agent.position.y = THREE.MathUtils.clamp(agent.position.y, -3, 9.5);
  }

  for (let index = 0; index < agents.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < agents.length; otherIndex += 1) {
      const agent = agents[index];
      const other = agents[otherIndex];
      const offset = agent.position.clone().sub(other.position);
      const distance = offset.length();
      const minDistance = agent.hitRadius + other.hitRadius;

      if (distance >= minDistance) continue;

      const normal = distance < 0.001 ? new THREE.Vector3(1, 0, 0) : offset.divideScalar(distance);
      const correction = (minDistance - distance) * 0.5;
      agent.position.addScaledVector(normal, correction);
      other.position.addScaledVector(normal, -correction);

      const agentTowardOther = agent.velocity.dot(normal);
      const otherTowardAgent = other.velocity.dot(normal);
      if (agentTowardOther < 0) agent.velocity.addScaledVector(normal, -agentTowardOther * 0.6);
      if (otherTowardAgent > 0) other.velocity.addScaledVector(normal, -otherTowardAgent * 0.6);
    }
  }
}
