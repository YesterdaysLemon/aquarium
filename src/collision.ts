import * as THREE from 'three';

export type SphereCollider = {
  id: string;
  kind: 'sphere';
  center: THREE.Vector3;
  radius: number;
};

export type BoxCollider = {
  id: string;
  kind: 'box';
  center: THREE.Vector3;
  size: THREE.Vector3;
};

export type EnvironmentCollider = SphereCollider | BoxCollider;

export const environmentColliders: EnvironmentCollider[] = [
  {
    id: 'main-cliff-core',
    kind: 'sphere',
    center: new THREE.Vector3(0, 0.8, 0),
    radius: 7.8,
  },
  {
    id: 'left-column',
    kind: 'sphere',
    center: new THREE.Vector3(-5.4, -0.8, 1.2),
    radius: 4.2,
  },
  {
    id: 'right-column',
    kind: 'sphere',
    center: new THREE.Vector3(5.2, -0.6, 1.1),
    radius: 4.1,
  },
  {
    id: 'top-stack',
    kind: 'sphere',
    center: new THREE.Vector3(0.8, 7.1, -0.4),
    radius: 3.4,
  },
  {
    id: 'arch-gap-guard',
    kind: 'box',
    center: new THREE.Vector3(0.3, 1.8, 0.6),
    size: new THREE.Vector3(8.4, 3.8, 3.4),
  },
  {
    id: 'reef-base',
    kind: 'box',
    center: new THREE.Vector3(0, -4.8, 0),
    size: new THREE.Vector3(18, 2.4, 12),
  },
];

export function getSphereAvoidance(
  position: THREE.Vector3,
  collider: SphereCollider,
  clearance: number,
  target = new THREE.Vector3(),
) {
  target.copy(position).sub(collider.center);
  const distance = target.length();
  const minDistance = collider.radius + clearance;

  if (distance >= minDistance) return null;

  if (distance < 0.001) {
    target.set(1, 0, 0);
  } else {
    target.divideScalar(distance);
  }

  return {
    normal: target,
    penetration: minDistance - distance,
  };
}

export function getBoxAvoidance(
  position: THREE.Vector3,
  collider: BoxCollider,
  clearance: number,
  target = new THREE.Vector3(),
) {
  const half = collider.size.clone().multiplyScalar(0.5).addScalar(clearance);
  const min = collider.center.clone().sub(half);
  const max = collider.center.clone().add(half);
  const closest = target.set(
    THREE.MathUtils.clamp(position.x, min.x, max.x),
    THREE.MathUtils.clamp(position.y, min.y, max.y),
    THREE.MathUtils.clamp(position.z, min.z, max.z),
  );
  const normal = position.clone().sub(closest);
  const distance = normal.length();

  if (distance >= clearance) return null;

  if (distance < 0.001) {
    const dx = Math.min(Math.abs(position.x - min.x), Math.abs(max.x - position.x));
    const dy = Math.min(Math.abs(position.y - min.y), Math.abs(max.y - position.y));
    const dz = Math.min(Math.abs(position.z - min.z), Math.abs(max.z - position.z));
    if (dx <= dy && dx <= dz) normal.set(position.x < collider.center.x ? -1 : 1, 0, 0);
    else if (dy <= dz) normal.set(0, position.y < collider.center.y ? -1 : 1, 0);
    else normal.set(0, 0, position.z < collider.center.z ? -1 : 1);
  } else {
    normal.divideScalar(distance);
  }

  return {
    normal,
    penetration: clearance - distance,
  };
}

export function getColliderAvoidance(
  position: THREE.Vector3,
  collider: EnvironmentCollider,
  clearance: number,
) {
  return collider.kind === 'sphere'
    ? getSphereAvoidance(position, collider, clearance)
    : getBoxAvoidance(position, collider, clearance);
}
