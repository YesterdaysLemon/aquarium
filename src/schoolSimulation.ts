import * as THREE from 'three';
import { environmentColliders, getColliderAvoidance } from './collision';
import { fishSpeciesById, type SpeciesId } from './fishSpecies';

export type FishAgentState = {
  id: number; species: SpeciesId; position: THREE.Vector3; velocity: THREE.Vector3;
  nextVelocity: THREE.Vector3; home: THREE.Vector3; phase: number; scale: number;
  hitRadius: number; orbitRadius: number; depth: number; speed: number;
  behavior: 'Cruising' | 'Schooling' | 'Foraging' | 'Hovering' | 'Scattering';
  effort: number;
};

// Radius, depth, length, cruising speed. The original freshwater guests stay.
const habitats: Record<SpeciesId, [number, number, number, number]> = {
  clownfish: [12, -.5, .95, .72], blueTang: [17, 2.2, 1.25, 1.1],
  yellowTang: [16, 1, 1.15, .95], goldfish: [15, 1.5, 1.15, .64],
  koi: [18, -.5, 1.65, .75], puffer: [12, -1.5, 1.15, .48],
  shark: [24, 3, 2.35, 1.25], chromis: [16, 5, .80, 1.18],
  anthias: [14, 3.8, .90, 1.0], bannerfish: [19, 1.5, 1.25, .78],
};
export function createAgents(high: boolean): FishAgentState[] {
  const groups: [SpeciesId, number][] = [
    ['blueTang', high ? 7 : 3], ['yellowTang', high ? 6 : 3], ['clownfish', high ? 5 : 2],
    ['chromis', high ? 14 : 6], ['anthias', high ? 10 : 4], ['bannerfish', high ? 4 : 2],
    ['goldfish', 2], ['koi', 2], ['puffer', 2], ['shark', 1],
  ];
  const agents: FishAgentState[] = [];
  groups.forEach(([species, count], group) => {
    const [radius, depth, length, speed] = habitats[species];
    for (let i = 0; i < count; i++) {
      const id = agents.length, angle = .75 + group * .68 + i * .10;
      const r = radius + Math.sin(i * 2.4) * 1.4;
      const position = new THREE.Vector3(Math.cos(angle) * r, depth + Math.sin(i * 1.9) * 1.1, Math.sin(angle) * r);
      const scale = length * (.9 + (id % 5) * .045);
      agents.push({ id, species, position, home: position.clone(),
        velocity: new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(speed),
        nextVelocity: new THREE.Vector3(), phase: id * 2.39996, scale,
        hitRadius: scale * .31, orbitRadius: radius, depth, speed,
        behavior: fishSpeciesById[species].schooling ? 'Schooling' : 'Cruising', effort: 1,
      });
    }
  });
  return agents;
}

const steer = new THREE.Vector3(), offset = new THREE.Vector3(), heading = new THREE.Vector3();
const alignment = new THREE.Vector3(), cohesion = new THREE.Vector3(), probe = new THREE.Vector3();
const normal = new THREE.Vector3();

export function stepSchool(agents: FishAgentState[], delta: number, time: number) {
  for (const fish of agents) {
    const info = fishSpeciesById[fish.species];
    const radius = Math.max(Math.hypot(fish.position.x, fish.position.z), .01);
    heading.copy(fish.velocity).normalize();
    const cycle = (time + fish.phase * 3) % 24;
    const foraging = (fish.species === 'clownfish' || fish.species === 'yellowTang' || fish.species === 'puffer') && cycle < 6;
    fish.behavior = foraging ? (fish.species === 'puffer' ? 'Hovering' : 'Foraging') : info.schooling ? 'Schooling' : 'Cruising';
    const speed = fish.speed * (foraging ? .35 : 1 + Math.sin(time * .7 + fish.phase) * .16);
    const targetRadius = fish.orbitRadius + Math.sin(time * .12 + fish.phase * .08) * 2 - (foraging ? 1.8 : 0);
    steer.copy(heading).multiplyScalar(speed);
    steer.x += -fish.position.z / radius * .30 - fish.position.x / radius * (radius - targetRadius) * .38;
    steer.z += fish.position.x / radius * .30 - fish.position.z / radius * (radius - targetRadius) * .38;
    // Shared water current, individual small turns, and gentle habitat changes.
    steer.x += Math.sin(time * .19 + fish.position.z * .16) * .16;
    steer.z += Math.cos(time * .16 + fish.position.x * .12) * .16;
    steer.y = (fish.depth + Math.sin(time * .28 + fish.phase) * .75 - (foraging ? 1.0 : 0) - fish.position.y) * .48;
    if (fish.species === 'clownfish' || fish.species === 'puffer') {
      offset.copy(fish.home).sub(fish.position);
      steer.addScaledVector(offset, foraging ? .13 : .025);
    }
    alignment.set(0, 0, 0); cohesion.set(0, 0, 0);
    let neighbors = 0, fear = 0;
    for (const other of agents) {
      if (other === fish) continue;
      offset.copy(other.position).sub(fish.position);
      const distanceSq = offset.lengthSq();
      if (distanceSq > 81) continue;
      const distance = Math.max(Math.sqrt(distanceSq), .001);
      const personalSpace = fish.hitRadius + other.hitRadius + .6;
      if (distance < personalSpace) steer.addScaledVector(offset, -2.4 * (personalSpace - distance) / distance);
      if (info.schooling && other.species === fish.species && distance < 5.5 && heading.dot(offset) / distance > -.5) {
        alignment.add(other.velocity); cohesion.add(other.position); neighbors++;
      }
      if (!info.predator && fishSpeciesById[other.species].predator && distance < 7.5) {
        const threat = 1 - distance / 7.5;
        steer.addScaledVector(offset, -threat * 4 / distance); fear = Math.max(fear, threat);
      }
    }
    if (neighbors) {
      steer.addScaledVector(alignment.divideScalar(neighbors).sub(fish.velocity), .65);
      steer.addScaledVector(cohesion.divideScalar(neighbors).sub(fish.position), .16);
    }
    if (fear > .05) fish.behavior = 'Scattering';
    // Look ahead before reaching the rock, instead of waiting for contact.
    probe.copy(fish.position).addScaledVector(heading, .8 + fish.velocity.length() * .7);
    for (const collider of environmentColliders) {
      const avoidance = getColliderAvoidance(probe, collider, fish.hitRadius + .7, normal);
      if (avoidance) steer.addScaledVector(avoidance.normal, avoidance.penetration * 2.6);
    }
    const maximum = fish.speed * (1.35 + fear * 1.7);
    steer.clampLength(foraging ? .12 : fish.speed * .55, maximum);
    fish.nextVelocity.copy(fish.velocity).lerp(steer, 1 - Math.exp(-delta * (fear > .05 ? 4 : 1.6)));
    fish.effort = THREE.MathUtils.lerp(fish.effort, fish.nextVelocity.length() / fish.speed, 1 - Math.exp(-delta * 3));
  }
  for (const fish of agents) {
    fish.velocity.copy(fish.nextVelocity);
    fish.position.addScaledVector(fish.velocity, delta);
    for (const collider of environmentColliders) {
      const collision = getColliderAvoidance(fish.position, collider, fish.hitRadius, normal);
      if (collision) {
        fish.position.addScaledVector(collision.normal, collision.penetration + .002);
        const inward = fish.velocity.dot(collision.normal);
        if (inward < 0) fish.velocity.addScaledVector(collision.normal, -inward);
      }
    }
    fish.position.y = THREE.MathUtils.clamp(fish.position.y, -3, 8.5);
    const radius = Math.hypot(fish.position.x, fish.position.z);
    if (radius > 29) {
      fish.position.x *= 29 / radius; fish.position.z *= 29 / radius;
      normal.set(fish.position.x, 0, fish.position.z).normalize();
      const outward = fish.velocity.dot(normal);
      if (outward > 0) fish.velocity.addScaledVector(normal, -outward);
    }
  }
}

// Stable selection: never rank a moving target every frame.
export function selectFollowFish(agents: FishAgentState[], species: SpeciesId, index: number) {
  const candidates = agents.filter(fish => fish.species === species);
  return candidates[((index % candidates.length) + candidates.length) % candidates.length];
}
