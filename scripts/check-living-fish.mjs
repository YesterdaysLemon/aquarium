import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { Vector3 } from 'three';
await mkdir('output/checks', { recursive: true });
await build({ entryPoints: ['src/schoolSimulation.ts'], outfile: 'output/checks/simulation.mjs', bundle: true, platform: 'node', format: 'esm' });
const { createAgents, stepSchool, selectFollowFish } = await import(pathToFileURL(path.resolve('output/checks/simulation.mjs')));
await build({ entryPoints: ['src/collision.ts'], outfile: 'output/checks/collision.mjs', bundle: true, platform: 'node', format: 'esm' });
const { getBoxAvoidance } = await import(pathToFileURL(path.resolve('output/checks/collision.mjs')));
const box = { id: 'test', kind: 'box', center: new Vector3(), size: new Vector3(2, 2, 2) };
assert.equal(getBoxAvoidance(new Vector3(2, 0, 0), box, .5), null, 'clearance is not expanded twice');
assert.equal(getBoxAvoidance(new Vector3(1.25, 0, 0), box, .5).penetration, .25);
assert.equal(getBoxAvoidance(new Vector3(), box, .5).penetration, 1.5, 'interior correction reaches the surface');
const a = createAgents(true), b = createAgents(true), low = createAgents(false);
assert.equal(a.length, 53);
assert.equal(low.length, 27);
const species = [...new Set(a.map(f => f.species))];
assert.equal(species.length, 10);
for (const id of species) {
  assert.ok(low.some(f => f.species === id), `${id} present in low quality`);
  assert.equal(selectFollowFish(a, id, -1).species, id);
  const data = await readFile(`public/assets/living-fish/${id}.glb`);
  assert.equal(data.readUInt32LE(0), 0x46546c67);
  const json = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
  assert.equal(json.meshes.length, 1, `${id}: isolated export`);
  assert.equal(json.scenes.length, 1);
  assert.ok(json.meshes[0].primitives[0].attributes.COLOR_0 !== undefined);
  const primitive = json.meshes[0].primitives[0];
  assert.ok(primitive.attributes.TEXCOORD_0 !== undefined, `${id}: anatomical tags survived Blender export`);
  const uv = json.accessors[primitive.attributes.TEXCOORD_0], uvView = json.bufferViews[uv.bufferView];
  assert.equal(uv.componentType, 5126);
  const binOffset = 20 + data.readUInt32LE(12) + 8;
  const parts = new Set();
  for (let v = 0; v < uv.count; v++) {
    const byte = binOffset + (uvView.byteOffset ?? 0) + (uv.byteOffset ?? 0) + v * (uvView.byteStride ?? 8);
    const part = data.readFloatLE(byte), span = data.readFloatLE(byte + 4);
    assert.ok(Math.abs(part - Math.round(part)) < .001 && part >= 0 && part <= 4);
    assert.ok(span >= -.001 && span <= 1.001, `${id}: fin span`);
    parts.add(Math.round(part));
  }
  for (const part of [0, 1, 2, 3]) assert.ok(parts.has(part), `${id}: body, tail, and paired pectorals are distinct`);
  if (id === 'puffer') assert.ok(parts.has(4), 'puffer dorsal/anal propulsion');
  assert.ok((await stat(`public/assets/living-fish/${id}.png`)).size > 1000);
}
const selectedId = selectFollowFish(a, 'blueTang', 2).id;
const behaviors = new Set();
for (let frame = 1; frame <= 7200; frame++) {
  stepSchool(a, 1 / 60, frame / 60);
  stepSchool(b, 1 / 60, frame / 60);
  for (let i = 0; i < a.length; i++) {
    const fish = a[i]; behaviors.add(fish.behavior);
    assert.ok(fish.position.toArray().every(Number.isFinite));
    assert.ok(Math.hypot(fish.position.x, fish.position.z) <= 29.00001);
    assert.ok(fish.position.y >= -3 && fish.position.y <= 8.5);
    assert.ok(fish.velocity.length() <= fish.speed * 3.06);
    assert.deepEqual(fish.position.toArray(), b[i].position.toArray(), 'deterministic replay');
  }
}
assert.equal(selectFollowFish(a, 'blueTang', 2).id, selectedId, 'follow identity remains stable');
assert.ok(behaviors.has('Foraging') && behaviors.has('Hovering') && behaviors.has('Schooling'));
const prey = a.find(f => f.species === 'chromis'), shark = a.find(f => f.species === 'shark');
shark.position.copy(prey.position).addScalar(2);
stepSchool(a, 1 / 60, 121);
assert.equal(prey.behavior, 'Scattering');
console.log('PASS: 10 isolated GLBs + portraits, both quality rosters, 120 seconds of deterministic bounded swimming, stable follow identity, foraging/hovering, and predator response.');
