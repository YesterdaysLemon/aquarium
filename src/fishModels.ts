import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { SpeciesId } from './fishSpecies';
import { createPufferGeometry, createSharkGeometry } from './distinctFishModels';

// Original, shared parametric meshes. Local +Z is forward; one draw per fish.
const silhouettes: Record<SpeciesId, [number, number, number]> = {
  clownfish: [.17, .29, .32], blueTang: [.12, .36, .40], yellowTang: [.12, .39, .40],
  goldfish: [.21, .31, .46], koi: [.19, .24, .32], puffer: [.32, .35, .20],
  shark: [.13, .14, .43], chromis: [.12, .24, .34], anthias: [.13, .25, .38],
  bannerfish: [.10, .43, .40],
};

function pigment(id: SpeciesId, z: number, y: number, angle: number) {
  let color = '#ee943c';
  if (id === 'clownfish') color = '#f47b20';
  if (id === 'blueTang') color = '#2362eb';
  if (id === 'yellowTang') color = '#efcc16';
  if (id === 'koi') color = Math.sin(z * 18 + Math.cos(angle * 3) * 2) > .2 ? '#d75122' : '#eee6d5';
  if (id === 'puffer') color = '#adab62';
  if (id === 'shark') color = '#6b8b98';
  if (id === 'chromis') color = '#53d2ca';
  if (id === 'anthias') color = y > .04 ? '#db588d' : '#ffb343';
  if (id === 'bannerfish') color = '#17252d';
  if (id === 'clownfish') {
    const band = Math.min(Math.abs(z - .28), Math.abs(z + .06), Math.abs(z + .39));
    if (band < .049) color = '#f4ecdb';
    else if (band < .068) color = '#262e31';
  }
  if (id === 'puffer' && Math.sin(z * 89) * Math.cos(angle * 19) > .72) color = '#475c43';
  const c = new THREE.Color(color);
  if (id === 'bannerfish') c.lerp(new THREE.Color('#efe9d6'), THREE.MathUtils.smoothstep(Math.sin(z * 13 + y * 4), -.04, .22));
  if (id === 'blueTang') {
    const marking = (1 - THREE.MathUtils.smoothstep(z, .20, .25)) * THREE.MathUtils.smoothstep(y, -.055, -.025)
      * (1 - THREE.MathUtils.smoothstep(y - .12 * Math.sin(z * 8), .13, .16));
    c.lerp(new THREE.Color('#112140'), marking);
  }
  // Countershading and a very fine scale variation, baked into vertex color.
  c.lerp(new THREE.Color('#dae6d5'), THREE.MathUtils.smoothstep(-y, .04, .30) * (id === 'shark' ? .8 : .22));
  c.multiplyScalar((.88 + .12 * Math.sin(angle)) * (1 + .025 * Math.sin(z * 150 + angle * 34)));
  return c;
}

function colored(geometry: THREE.BufferGeometry, color: THREE.Color) {
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) color.toArray(colors, i * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
  return geometry.toNonIndexed();
}

export function createFishGeometry(id: SpeciesId) {
  const special: Partial<Record<SpeciesId, () => THREE.BufferGeometry>> = { shark: createSharkGeometry, puffer: createPufferGeometry };
  const buildSpecial = special[id];
  if (buildSpecial) return buildSpecial();
  const [width, height, tailHeight] = silhouettes[id];
  const vertices: number[] = [], colors: number[] = [], indices: number[] = [];
  const rings = 72, sides = 48;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, z = .50 - t;
    // Full shoulder, tapering caudal peduncle, a small rounded mouth.
    const profile = .055 + .945 * Math.pow(Math.sin(Math.PI * t), .78) * (1.1 - .43 * t);
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const y = Math.sin(angle) * height * profile;
      vertices.push(Math.cos(angle) * width * profile, y, z);
      pigment(id, z, y, angle).toArray(colors, colors.length);
      if (i < rings && j < sides) {
        const a = i * (sides + 1) + j, b = a + sides + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  body.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  body.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(vertices.length / 3 * 2), 2));
  body.setIndex(indices); body.computeVertexNormals();
  const parts = [body.toNonIndexed()];
  const finColor = id === 'blueTang' ? '#2456b7' : id === 'bannerfish' ? '#e7ce35'
    : id === 'shark' ? '#536f7c' : id === 'chromis' ? '#8ddad0' : id === 'anthias' ? '#ed858d' : id === 'koi' ? '#dadbc8' : '#eaba3d';

  // Ruled fin surfaces: fine ribs, curved edges and a tapered trailing membrane.
  function fin(root: THREE.Vector3, edge: (t: number) => THREE.Vector3, color = finColor, part = 0) {
    const points: number[] = [], shades: number[] = [], idx: number[] = [], tags: number[] = [];
    const rays = 28, spans = 5;
    for (let i = 0; i <= rays; i++) for (let j = 0; j <= spans; j++) {
      const t = i / rays, s = j / spans;
      const p = root.clone().lerp(edge(t), s);
      p.x += Math.sin(t * Math.PI) * Math.sin(s * Math.PI) * .025;
      p.toArray(points, points.length);
      tags.push(part, s);
      const c = new THREE.Color(color).multiplyScalar(id === 'shark' ? 1 : i % 2 === 0 ? .82 : 1.08);
      c.lerp(new THREE.Color('#d9e9de'), s * .16).toArray(shades, shades.length);
      if (i < rays && j < spans) {
        const a = i * (spans + 1) + j, b = a + spans + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(shades, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(tags, 2));
    g.setIndex(idx); g.computeVertexNormals(); parts.push(g.toNonIndexed());
  }
  fin(new THREE.Vector3(0, 0, -.45), t => new THREE.Vector3(0, (t - (id === 'shark' ? .38 : .5)) * tailHeight * 2,
    -.79 + Math.sin(t * Math.PI) * (id === 'goldfish' ? -.06 : .16)), id === 'blueTang' ? '#edce23' : finColor, 1);
  fin(new THREE.Vector3(0, .05, -.25), t => new THREE.Vector3(0,
    height * (.45 + (id === 'shark' ? Math.max(0, 1 - Math.abs(t - .4) * 2.5) * 2.0 : Math.sin(t * Math.PI) * (id === 'puffer' ? .30 : .85))), .25 - t * .72));
  if (id === 'bannerfish') {
    // A narrow trailing dorsal pennant rather than a tall triangular sail.
    const strip: number[] = [], stripIndices: number[] = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32, y = height * .9 + Math.sin(t * 2.1) * .57;
      const z = .12 - t * .98, breadth = .045 * (1 - t) + .002;
      strip.push(0, y - breadth, z, 0, y + breadth, z);
      if (i < 32) { const a = i * 2; stripIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const pennant = new THREE.BufferGeometry();
    pennant.setAttribute('position', new THREE.Float32BufferAttribute(strip, 3));
    pennant.setIndex(stripIndices); pennant.computeVertexNormals();
    parts.push(colored(pennant, new THREE.Color('#eee9d5')));
  }
  fin(new THREE.Vector3(0, -.06, -.24), t => new THREE.Vector3(0,
    -height * (.45 + Math.sin(t * Math.PI) * .65), .03 - t * .57));
  for (const sign of [-1, 1]) {
    fin(new THREE.Vector3(sign * width * .75, -.04, .12), t => new THREE.Vector3(
      sign * (width + Math.sin(t * Math.PI) * .14), -.05 - Math.sin(t * Math.PI) * .09, .12 - t * .32), finColor, sign < 0 ? 2 : 3);
    const eye = new THREE.SphereGeometry(id === 'shark' ? .017 : .033, 12, 8);
    eye.scale(.45, 1, 1); eye.translate(sign * width * .72, height * .22, .31);
    parts.push(colored(eye, new THREE.Color(id === 'shark' ? '#657478' : '#c9b36c')));
    const pupil = new THREE.SphereGeometry(id === 'shark' ? .012 : .022, 12, 8);
    pupil.scale(.5, 1, 1); pupil.translate(sign * (width * .72 + .011), height * .22, .316);
    parts.push(colored(pupil, new THREE.Color('#081823')));
    // A fine curved operculum seam follows each cheek.
    const gillCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * width * .71, height * .46, .16),
      new THREE.Vector3(sign * width * .86, 0, .12),
      new THREE.Vector3(sign * width * .70, -height * .43, .16),
    ]);
    parts.push(colored(new THREE.TubeGeometry(gillCurve, 12, .004, 4, false), new THREE.Color('#455b55')));
    if (id === 'shark') for (let g = 1; g <= 4; g++) {
      const slit = new THREE.TubeGeometry(gillCurve, 12, .003, 4, false);
      slit.translate(sign * width * .025 * g, 0, -g * .034);
      parts.push(colored(slit, new THREE.Color('#344c55')));
    }
  }
  const result = mergeGeometries(parts)!;
  result.computeBoundingSphere();
  for (const part of parts) part.dispose();
  body.dispose();
  return result;
}
