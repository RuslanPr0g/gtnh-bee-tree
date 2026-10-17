import { describe, expect, it } from 'vitest';
import { graph as g, questLine as ql } from '../data';
import { allPaths, beePath, legacyTarget, questPath } from './paths';

describe('paths', () => {
  it('builds readable, unique paths', () => {
    expect(beePath(g, 'forestry.speciesHeroic')).toBe('/bee/forestry/heroic/');
    expect(beePath(g, 'magicbees.speciesAbandoned')).toBe('/bee/magic-bees/abandoned/');
    expect(beePath(g, 'magicbees.speciesMystical')).not.toBe(
      beePath(g, 'extrabees.species.mystical'),
    );
    expect(questPath(ql, '0:358')).toBe('/quest/naquadah/');
    const all = allPaths(g, ql);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(1 + g.species.length + ql.nodes.length);
    for (const p of all) expect(p).toMatch(/^\/([a-z0-9-]+\/)*$/);
  });

  it('redirects old hash links', () => {
    expect(legacyTarget('#/bee/forestry.speciesHeroic', g, ql)).toBe('/bee/forestry/heroic/');
    expect(legacyTarget('#/quest/0%3A358', g, ql)).toBe('/quest/naquadah/');
    expect(legacyTarget('#b:forestry.speciesHeroic', g, ql)).toBe('/bee/forestry/heroic/');
    expect(legacyTarget('#q:0:358', g, ql)).toBe('/quest/naquadah/');
    expect(legacyTarget('#forestry.speciesHeroic', g, ql)).toBe('/bee/forestry/heroic/');
    expect(legacyTarget('#/import?d=abc', g, ql)).toBe('/import?d=abc');
    expect(legacyTarget('#nope', g, ql)).toBeNull();
    expect(legacyTarget('#%E0%A4%A', g, ql)).toBeNull();
    expect(legacyTarget('', g, ql)).toBeNull();
  });
});
