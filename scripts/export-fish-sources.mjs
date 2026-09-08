// Bridge the authored parametric surfaces into Blender for mesh finishing/export.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
await mkdir('output/models', { recursive: true });
await build({ entryPoints: ['src/fishModels.ts'], outfile: 'output/models/fish-models.mjs', bundle: true, platform: 'node', format: 'esm' });
const { createFishGeometry } = await import(pathToFileURL(path.resolve('output/models/fish-models.mjs')));
const ids = ['clownfish', 'blueTang', 'yellowTang', 'goldfish', 'koi', 'puffer', 'shark', 'chromis', 'anthias', 'bannerfish'];
const sources = ids.map(id => {
  const geometry = createFishGeometry(id);
  return { id, positions: Array.from(geometry.attributes.position.array), colors: Array.from(geometry.attributes.color.array), animationUV: Array.from(geometry.attributes.uv.array) };
});
await writeFile('output/models/fish-sources.json', JSON.stringify(sources));
await build({ entryPoints: ['src/fishSpecies.ts'], outfile: 'output/models/fish-species.mjs', bundle: true, platform: 'node', format: 'esm' });
const { fishSpecies } = await import(pathToFileURL(path.resolve('output/models/fish-species.mjs')));
await mkdir('public/assets/living-fish', { recursive: true });
await writeFile('public/assets/living-fish/manifest.json', JSON.stringify({
  authoring: 'Original Ocean Slice surfaces, finished and exported with Blender',
  source: 'docs/living-fish-studio.blend',
  fish: fishSpecies.map(species => ({ ...species, model: `/assets/living-fish/${species.id}.glb` })),
}, null, 2) + '\n');
console.log(`Prepared ${sources.length} original fish meshes for Blender.`);
