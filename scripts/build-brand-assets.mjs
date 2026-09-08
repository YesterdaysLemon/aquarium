import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
const mark = await readFile('public/favicon.svg');
for (const [name, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await sharp(mark).resize(size, size).png().toFile(`public/${name}`);
}
const png = await sharp(mark).resize(32, 32).png().toBuffer();
const ico = Buffer.alloc(22); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico[6] = 32; ico[7] = 32; ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
await writeFile('public/favicon.ico', Buffer.concat([ico, png]));
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="sea" x2="1" y2="1"><stop stop-color="#123e51"/><stop offset="1" stop-color="#031725"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#sea)"/>
<g fill="none" stroke="#6ad1cd" opacity=".12"><circle cx="1050" cy="130" r="300"/><circle cx="1050" cy="130" r="340"/><circle cx="1050" cy="130" r="380"/></g>
<image href="data:image/svg+xml;base64,${mark.toString('base64')}" x="88" y="114" width="128" height="128"/>
<text x="88" y="362" font-family="Segoe UI,Arial,sans-serif" font-size="94" font-weight="600" fill="#ecf8ef">Ocean Slice</text>
<text x="93" y="422" font-family="Segoe UI,Arial,sans-serif" font-size="30" fill="#9dcacb">A quiet, living aquarium.</text>
<path d="M88 518q42-20 84 0t84 0t84 0" stroke="#7bdcd5" stroke-width="3" fill="none"/>
</svg>`;
await sharp(Buffer.from(card)).png().toFile('public/social-preview.png');
console.log('Generated favicon, Safari/Apple icons, app icons and social preview.');
