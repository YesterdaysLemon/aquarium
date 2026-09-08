import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// UVs are animation metadata: x = anatomical part, y = distance from fin root.
// 0 body, 1 caudal fin, 2/3 paired pectorals, 4 dorsal/anal paddles.
function finish(g: THREE.BufferGeometry, color: string, part = 0) {
  const positions = g.attributes.position;
  const colors: number[] = [], tags: number[] = [];
  const c = new THREE.Color(color);
  for (let i = 0; i < positions.count; i++) { c.toArray(colors, colors.length); tags.push(part, 0); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(tags, 2));
  return g.index ? g.toNonIndexed() : g;
}

function eye(parts: THREE.BufferGeometry[], position: THREE.Vector3, radius: number, sign: number, puffer = false) {
  const orb = new THREE.SphereGeometry(radius, 20, 14);
  orb.scale(puffer ? .80 : .45, 1, 1); orb.translate(...position.toArray());
  parts.push(finish(orb, puffer ? '#bdad64' : '#889999'));
  const pupil = new THREE.SphereGeometry(radius * .62, 16, 10);
  pupil.scale(.5, 1, 1);
  pupil.translate(position.x + sign * radius * .66, position.y, position.z + radius * .14);
  parts.push(finish(pupil, '#071a20'));
  const highlight = new THREE.SphereGeometry(radius * .16, 8, 6);
  highlight.translate(position.x + sign * radius * .93, position.y + radius * .28, position.z + radius * .3);
  parts.push(finish(highlight, '#dcedd9'));
}

function seam(parts: THREE.BufferGeometry[], points: THREE.Vector3[], thickness: number, color: string) {
  parts.push(finish(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, thickness, 5, false), color));
}

function paddle(root: THREE.Vector3, edge: (t: number) => THREE.Vector3, color: string, part: number, thick = false) {
  const p: number[] = [], c: number[] = [], uv: number[] = [], indices: number[] = [];
  const rays = 24, spans = 8;
  for (let i = 0; i <= rays; i++) for (let j = 0; j <= spans; j++) {
    const t = i / rays, s = j / spans;
    const v = root.clone().lerp(edge(t), s);
    if (thick) v.x += Math.sin(t * Math.PI) * Math.sin(s * Math.PI) * .014;
    v.toArray(p, p.length);
    new THREE.Color(color).multiplyScalar(thick ? 1 : .94 + (i % 2) * .09).toArray(c, c.length);
    uv.push(part, s);
    if (i < rays && j < spans) {
      const a = i * (spans + 1) + j, b = a + spans + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry.toNonIndexed();
}

function join(parts: THREE.BufferGeometry[]) {
  const result = mergeGeometries(parts)!;
  result.computeBoundingSphere();
  parts.forEach(g => g.dispose());
  return result;
}

export function createSharkGeometry() {
  // A separate longitudinal loft: broad blunt snout, muscular trunk, narrow peduncle.
  const stations = [
    [.78, .009, .008, -.025], [.68, .085, .045, -.01], [.51, .14, .088, .005],
    [.28, .165, .14, .005], [0, .156, .145, 0], [-.30, .115, .11, -.01],
    [-.59, .065, .067, -.01], [-.83, .024, .034, .01], [-.94, .012, .022, .025],
  ];
  const points: number[] = [], colors: number[] = [], tags: number[] = [], faces: number[] = [];
  const rings = 96, sides = 40;
  for (let i = 0; i <= rings; i++) {
    const z = .78 - i / rings * 1.72;
    let k = 0;
    while (k < stations.length - 2 && z < stations[k + 1][0]) k++;
    const a = stations[k], b = stations[k + 1];
    const t = THREE.MathUtils.smoothstep((a[0] - z) / (a[0] - b[0]), 0, 1);
    const w = THREE.MathUtils.lerp(a[1], b[1], t), h = THREE.MathUtils.lerp(a[2], b[2], t);
    const cy = THREE.MathUtils.lerp(a[3], b[3], t);
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const sy = Math.sin(angle);
      points.push(Math.cos(angle) * w, cy + sy * h * (sy < 0 ? .74 : 1), z);
      const color = new THREE.Color('#607c87').lerp(new THREE.Color('#d9dfd6'), THREE.MathUtils.smoothstep(-sy, .02, .6));
      color.multiplyScalar(.96 + .025 * Math.sin(i * 5.7 + j * 2.1));
      color.toArray(colors, colors.length); tags.push(0, 0);
      if (i < rings && j < sides) { const a = i * (sides + 1) + j, b = a + sides + 1; faces.push(a, b, a + 1, b, b + 1, a + 1); }
    }
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  body.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  body.setAttribute('uv', new THREE.Float32BufferAttribute(tags, 2));
  body.setIndex(faces); body.computeVertexNormals();
  const parts = [body.toNonIndexed()];
  // Two swept dorsal fins; tail lobes have genuinely different lengths and angles.
  parts.push(paddle(new THREE.Vector3(0, .095, -.17), t => new THREE.Vector3(0,
    .12 + Math.max(0, 1 - Math.abs(t - .35) / .35) * .29, .13 - t * .47), '#647b82', 0, true));
  parts.push(paddle(new THREE.Vector3(0, .045, -.66), t => new THREE.Vector3(0,
    .06 + Math.sin(t * Math.PI) * .075, -.55 - t * .20), '#657c83', 0, true));
  parts.push(paddle(new THREE.Vector3(0, .025, -.88), t => {
    const y = -.27 + t * .77;
    return new THREE.Vector3(0, y, -1.31 + Math.sin(t * Math.PI) * .30 - t * .17);
  }, '#677f88', 1, true));
  for (const sign of [-1, 1]) {
    parts.push(paddle(new THREE.Vector3(sign * .12, -.045, .14), t => new THREE.Vector3(
      sign * (.15 + Math.sin(t * Math.PI) * .37), -.07 - Math.sin(t * Math.PI) * .075,
      .13 - t * .61), '#7f959a', sign < 0 ? 2 : 3, true));
    parts.push(paddle(new THREE.Vector3(sign * .08, -.075, -.43), t => new THREE.Vector3(
      sign * (.08 + Math.sin(t * Math.PI) * .11), -.085, -.39 - t * .23), '#83999a', 0, true));
    eye(parts, new THREE.Vector3(sign * .12, .025, .48), .018, sign);
    for (let g = 0; g < 5; g++) {
      const z = .26 - g * .045, x = sign * (.157 + Math.sin(g) * .003);
      seam(parts, [new THREE.Vector3(x * .83, .078, z), new THREE.Vector3(x, .008, z - .018), new THREE.Vector3(x * .88, -.063, z)], .003, '#34494e');
    }
  }
  seam(parts, [new THREE.Vector3(-.075, -.038, .60), new THREE.Vector3(0, -.052, .55), new THREE.Vector3(.075, -.038, .60)], .004, '#30474d');
  body.dispose();
  return join(parts);
}

export function createPufferGeometry() {
  // An ovoid trunk with a short stalk, not a flattened reef-fish silhouette.
  const body = new THREE.SphereGeometry(1, 64, 40);
  const position = body.attributes.position;
  const colors: number[] = [];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    position.setXYZ(i, x * .33 * (1 + z * .10), y * .31 - .025, z * .40);
    const spots = Math.sin(x * 38 + Math.sin(z * 16)) * Math.sin(z * 32 + y * 7);
    const color = new THREE.Color('#a79e62').lerp(new THREE.Color('#ede6c9'), THREE.MathUtils.smoothstep(-y, -.05, .55));
    if (y > -.3) color.lerp(new THREE.Color('#485447'), THREE.MathUtils.smoothstep(spots, .55, .78) * .9);
    color.toArray(colors, colors.length);
  }
  body.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  body.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(position.count * 2), 2));
  body.computeVertexNormals();
  const parts = [body.toNonIndexed()];
  const stalk = new THREE.SphereGeometry(1, 24, 16); stalk.scale(.073, .08, .15); stalk.translate(0, -.025, -.40);
  parts.push(finish(stalk, '#a8a170'));
  parts.push(paddle(new THREE.Vector3(0, -.025, -.49), t => new THREE.Vector3(0, -.025 + Math.sin((t - .5) * 2.5) * .15,
    -.65 - Math.cos((t - .5) * 2.5) * .10), '#c2b576', 1));
  for (const sign of [-1, 1]) {
    parts.push(paddle(new THREE.Vector3(sign * .275, -.035, .10), t => new THREE.Vector3(sign * (.31 + Math.sin(t * Math.PI) * .17),
      -.035 + Math.cos(t * Math.PI) * .11, .06 - Math.sin(t * Math.PI) * .15), '#d6c990', sign < 0 ? 2 : 3));
    eye(parts, new THREE.Vector3(sign * .255, .12, .235), .066, sign, true);
  }
  for (const sign of [-1, 1]) parts.push(paddle(new THREE.Vector3(0, sign * .19 - .025, -.25), t => new THREE.Vector3(0,
    sign * (.20 + Math.sin(t * Math.PI) * .14) - .025, -.19 - t * .23), '#c7bd80', 4));
  // Small resting spines follow the rounded body; it is not permanently inflated.
  for (let i = 0; i < 90; i++) {
    const y = -.1 + (i / 90) * 1.03, angle = i * 2.39996;
    const r = Math.sqrt(1 - y * y), direction = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
    if (direction.z > .64) continue;
    const spine = new THREE.ConeGeometry(.008, .026, 5);
    spine.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction));
    spine.translate(direction.x * .332 * (1 + direction.z * .10), direction.y * .315 - .025, direction.z * .405);
    parts.push(finish(spine, '#c0b57b'));
  }
  const lips = new THREE.TorusGeometry(.030, .008, 8, 20); lips.scale(1, .70, 1); lips.translate(0, -.02, .402);
  parts.push(finish(lips, '#807751'));
  body.dispose();
  return join(parts);
}
