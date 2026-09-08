import { build } from 'esbuild';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Render the same component used by React so credits and author links also work without JavaScript.
const result = await build({
  stdin: { contents: "import { createElement } from 'react'; import { renderToStaticMarkup } from 'react-dom/server'; import { CreditsPage } from './src/CreditsPage'; export default renderToStaticMarkup(createElement(CreditsPage));", resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, platform: 'node', format: 'esm', write: false, packages: 'external',
  jsx: 'automatic',
});
await mkdir('output', { recursive: true });
const modulePath = resolve('output/prerender-credits.mjs');
await writeFile(modulePath, result.outputFiles[0].text);
let markup;
try { ({ default: markup } = await import(pathToFileURL(modulePath).href)); }
finally { await unlink(modulePath); }
let html = await readFile('dist/index.html', 'utf8');
const title = 'About &amp; Credits — Ocean Slice by Alireza Afshan';
html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
  .replace(/(<link rel="canonical" href=")[^"]+/, '$1https://fish.alirezaafshan.com/credits')
  .replace(/(<meta property="og:url" content=")[^"]+/, '$1https://fish.alirezaafshan.com/credits')
  .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]+"/g, `$1${title}"`)
  .replace(/(<meta\s+(?:name="description"|property="og:description"|name="twitter:description")\s+content=")[^"]+"/g,
    '$1Meet the fish and creators behind Ocean Slice, an interactive 3D aquarium by Alireza Afshan. Read model credits and explore more projects."')
  .replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${markup}</div>`)
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'AboutPage', url: 'https://fish.alirezaafshan.com/credits',
    name: 'About & Credits — Ocean Slice', isPartOf: { '@id': 'https://fish.alirezaafshan.com/#website' },
    author: { '@type': 'Person', name: 'Alireza Afshan', url: 'https://alirezaafshan.com/' },
  })}</script>`);
await mkdir('dist/credits', { recursive: true });
await writeFile('dist/credits/index.html', html);
console.log('Prerendered /credits with crawlable author links and route metadata.');
