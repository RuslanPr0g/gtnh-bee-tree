// Syncs src/data/names.json (plain-language meaning of each bee name) with bees.json:
// every species name gets a key, new ones start empty, names no longer in the dump are dropped.
// Usage: node tools/bee-names.mjs [--missing]   (--missing only prints names without a definition)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const BEES = new URL('../src/data/bees.json', import.meta.url);
const OUT = new URL('../src/data/names.json', import.meta.url);

const names = [...new Set(JSON.parse(readFileSync(BEES, 'utf8')).species.map((s) => s.name))];
names.sort((a, b) => a.localeCompare(b));
const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const missing = names.filter((n) => !old[n]?.trim());

if (process.argv.includes('--missing')) {
  console.log(missing.join('\n'));
} else {
  const dropped = Object.keys(old).filter((n) => !names.includes(n));
  writeFileSync(
    OUT,
    JSON.stringify(Object.fromEntries(names.map((n) => [n, old[n] ?? ''])), null, 2) + '\n',
  );
  console.log(
    `${names.length} names, ${missing.length} without a definition, ${dropped.length} dropped`,
  );
}
