// Builds src/assets/generated/bees.png: one 16x16 icon per species (in bees.json order), stacked
// vertically. Each icon is Forestry's drone texture layers tinted like the game does it:
// outline × color 1, body × color 2, stripes untinted, drawn over each other.
// Runs before dev/build/test (see package.json), so icons always match the data.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const root = new URL('..', import.meta.url);
const read = (p) => PNG.sync.read(readFileSync(new URL(p, root)));
const layers = ['drone.outline.png', 'body1.png', 'drone.body2.png'].map((f) =>
  read(`src/assets/bee/${f}`),
);
const { species } = JSON.parse(readFileSync(new URL('src/data/bees.json', root), 'utf8'));

const S = 16;
const out = new PNG({ width: S, height: S * species.length });
species.forEach((s, n) => {
  const tints = [s.color, s.color2, 0xffffff].map((c) => [
    (c >> 16) & 255,
    (c >> 8) & 255,
    c & 255,
  ]);
  layers.forEach((img, l) => {
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const i = (y * img.width + x) * 4; // animated textures: frame 0 is the top 16 rows
        const a = img.data[i + 3] / 255;
        if (!a) continue;
        const o = ((n * S + y) * S + x) * 4;
        const da = out.data[o + 3] / 255;
        const oa = a + da * (1 - a);
        for (let c = 0; c < 3; c++) {
          const src = (img.data[i + c] * tints[l][c]) / 255; // multiply tint
          out.data[o + c] = Math.round((src * a + out.data[o + c] * da * (1 - a)) / oa);
        }
        out.data[o + 3] = Math.round(oa * 255);
      }
  });
});

mkdirSync(new URL('src/assets/generated/', root), { recursive: true });
writeFileSync(new URL('src/assets/generated/bees.png', root), PNG.sync.write(out));
console.log(`bee icons: ${species.length} → src/assets/generated/bees.png`);
