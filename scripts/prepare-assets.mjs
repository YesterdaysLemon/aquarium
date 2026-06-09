import AdmZip from 'adm-zip';
import obj2gltf from 'obj2gltf';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve('.');
const modelDir = join(root, 'models');
const tmpDir = join(root, 'tmp', 'assets-src');
const publicDir = join(root, 'public', 'assets');
const fishZipPath = join(modelDir, 'Cute Fish Pack - Feb 2020-20260609T172858Z-3-001.zip');
const environmentZipPath = join(modelDir, 'underwater-environment.zip');

const fishNames = [
  'Clownfish',
  'BlueTang',
  'YellowTang',
  'Goldfish',
  'Koi',
  'Puffer',
  'Shark',
];

const ensureDir = (path) => mkdir(path, { recursive: true });

async function extractEntry(zip, entryName, outputPath) {
  const entry = zip.getEntry(entryName);
  if (!entry) {
    throw new Error(`Missing archive entry: ${entryName}`);
  }
  await ensureDir(dirname(outputPath));
  await writeFile(outputPath, entry.getData());
}

async function prepareFish() {
  if (!existsSync(fishZipPath)) {
    console.warn('Fish archive not found; skipping fish conversion.');
    return [];
  }

  const zip = new AdmZip(fishZipPath);
  const converted = [];

  for (const name of fishNames) {
    const baseEntry = `Cute Fish Pack - Feb 2020/OBJ/${name}`;
    const objPath = join(tmpDir, 'fish', `${name}.obj`);
    const mtlPath = join(tmpDir, 'fish', `${name}.mtl`);
    const glbPath = join(publicDir, 'fish', `${name}.glb`);

    await extractEntry(zip, `${baseEntry}.obj`, objPath);
    await extractEntry(zip, `${baseEntry}.mtl`, mtlPath);
    await ensureDir(dirname(glbPath));

    const gltf = await obj2gltf(objPath, {
      binary: true,
      separate: false,
      metallicRoughness: true,
    });
    await writeFile(glbPath, gltf);
    converted.push({ name, path: `/assets/fish/${name}.glb` });
  }

  return converted;
}

async function prepareEnvironment() {
  if (!existsSync(environmentZipPath)) {
    console.warn('Environment archive not found; skipping environment conversion.');
    return null;
  }

  const outer = new AdmZip(environmentZipPath);
  const nestedEntry = outer.getEntry('source/Underwater environment 2.zip');
  if (!nestedEntry) {
    console.warn('Nested environment source archive not found; skipping environment conversion.');
    return null;
  }

  const nestedZipPath = join(tmpDir, 'environment-source.zip');
  await ensureDir(dirname(nestedZipPath));
  await writeFile(nestedZipPath, nestedEntry.getData());

  const nested = new AdmZip(nestedZipPath);
  const envDir = join(tmpDir, 'environment');
  const fbxPath = join(envDir, 'Underwater environment 2.fbx');
  await extractEntry(nested, 'Underwater environment 2.fbx', fbxPath);

  for (const entry of nested.getEntries()) {
    if (!entry.isDirectory && /\.(jpe?g|png)$/i.test(entry.entryName)) {
      await extractEntry(nested, entry.entryName, join(envDir, entry.entryName));
    }
  }

  const outputPath = join(publicDir, 'environment', 'underwater-environment.glb');
  const rawOutputPath = join(publicDir, 'environment', 'underwater-environment.raw.glb');
  await ensureDir(dirname(outputPath));

  const binCandidates = process.platform === 'win32'
    ? [
        join(root, 'node_modules', '.bin', 'fbx2gltf.cmd'),
        join(root, 'node_modules', 'fbx2gltf', 'bin', 'Windows_NT', 'FBX2glTF.exe'),
      ]
    : [
        join(root, 'node_modules', '.bin', 'fbx2gltf'),
        join(root, 'node_modules', 'fbx2gltf', 'bin', process.platform === 'darwin' ? 'Darwin' : 'Linux', 'FBX2glTF'),
      ];
  const bin = binCandidates.find((candidate) => existsSync(candidate));

  if (!existsSync(bin)) {
    console.warn('fbx2gltf binary not found; environment model will use the procedural fallback.');
    return null;
  }

  const result = spawnSync(bin, ['-i', fbxPath, '-o', rawOutputPath], {
    cwd: envDir,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0 || !existsSync(rawOutputPath)) {
    console.warn('Environment FBX conversion failed; the app will use the procedural fallback.');
    return null;
  }

  const gltfTransform = join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');
  const optimizedPath = join(publicDir, 'environment', 'underwater-environment.optimized.glb');
  await rm(optimizedPath, { force: true });

  if (existsSync(gltfTransform)) {
    const optimize = spawnSync(
      process.execPath,
      [
        gltfTransform,
        'optimize',
        rawOutputPath,
        optimizedPath,
        '--texture-compress',
        'webp',
        '--texture-size',
        '2048',
        '--simplify',
        'true',
        '--compress',
        'meshopt',
      ],
      { cwd: root, stdio: 'inherit', shell: false },
    );

    if (optimize.status === 0 && existsSync(optimizedPath)) {
      await rm(rawOutputPath, { force: true });
      await rm(outputPath, { force: true });
      await rename(optimizedPath, outputPath);
      return '/assets/environment/underwater-environment.glb';
    }

    console.warn('Environment optimization failed; using raw converted GLB.');
  }

  await rm(outputPath, { force: true });
  await rename(rawOutputPath, outputPath);

  return '/assets/environment/underwater-environment.glb';
}

await rm(tmpDir, { recursive: true, force: true });
await ensureDir(publicDir);

const fish = await prepareFish();
const environment = await prepareEnvironment();

await writeFile(
  join(publicDir, 'manifest.json'),
  JSON.stringify({ fish, environment }, null, 2),
);

console.log(`Converted ${fish.length} fish models.`);
console.log(environment ? 'Converted environment model.' : 'Using procedural environment fallback.');
