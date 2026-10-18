import { describe, expect, it } from 'vitest';
import raw from '../data/bees.json';
import {
  ancestors,
  buildGraph,
  canBreed,
  computeUnwanted,
  matchesSearch,
  searchWords,
  stepIn,
  unmarkNope,
  type RawData,
} from './graph';

const g = buildGraph(raw as unknown as RawData);
const id = (name: string, mod?: string) => {
  const s = g.species.find((x) => x.name === name && (!mod || x.mod === mod));
  if (!s) throw new Error(`no bee ${name}`);
  return s.uid;
};
const set = (...xs: string[]) => new Set(xs);

describe('graph', () => {
  it('loads every species and recipe', () => {
    expect(g.species).toHaveLength(450);
    expect(Object.values(g.makes).flat()).toHaveLength(538);
  });

  it('cleans untranslated branch names', () => {
    expect(g.byId['gregtech.bee.speciesNaquadah'].branch).toBe('Radioactive');
    expect(g.species.some((s) => s.branch?.startsWith('for.'))).toBe(false);
  });

  it('finds ancestors recursively', () => {
    const a = ancestors(g, id('Heroic'));
    expect(a.has(id('Steadfast'))).toBe(true);
    expect(a.has(id('Valiant'))).toBe(true);
  });
});

describe('not wanted', () => {
  it('marks bees that can only be bred from a marked bee', () => {
    const u = computeUnwanted(g, set(id('Growing')), set());
    expect(u.has(id('Thriving'))).toBe(true);
    // the partner and the marked bee's own parents stay wanted
    expect(u.has(id('Unweary'))).toBe(false);
    expect(u.has(id('Forest'))).toBe(false);
    expect(u.has(id('Diligent'))).toBe(false);
  });

  it('keeps a bee that has another recipe without a marked parent', () => {
    const u = computeUnwanted(g, set(id('Mystical', 'magicbees')), set());
    expect(u.has(id('Common'))).toBe(false);
    expect(u.size).toBeLessThan(50);
  });

  it('tracks causes when two marks are needed together', () => {
    const roots = set(id('Meadows'), id('Forest'));
    const u = computeUnwanted(g, roots, set());
    expect(u.get(id('Arid'))).toEqual(roots);
    expect(computeUnwanted(g, set(id('Meadows')), set()).has(id('Arid'))).toBe(false);
  });

  it('never marks owned bees, and owned roots do nothing', () => {
    const u = computeUnwanted(g, set(id('Growing')), set(id('Thriving')));
    expect(u.has(id('Thriving'))).toBe(false);
    expect(computeUnwanted(g, set(id('Growing')), set(id('Growing'))).size).toBe(0);
  });

  it('handles a bee that breeds into itself', () => {
    expect([...computeUnwanted(g, set(id('Fungal')), set()).keys()]).toEqual([id('Fungal')]);
  });

  it('unmarking a derived bee removes its causes and keeps other roots', () => {
    const other = id('Eldritch');
    const next = unmarkNope(g, id('Thriving'), set(id('Growing'), other), set());
    expect(next).toEqual(set(other));
    expect(computeUnwanted(g, next, set()).has(id('Thriving'))).toBe(false);
  });

  it('unmarking always ends with the bee wanted', () => {
    const roots = set(id('Common'), id('Marshy'), id('Explosive'), id('White', 'gendustry'));
    const u = computeUnwanted(g, roots, set());
    for (const uid of u.keys()) {
      const next = unmarkNope(g, uid, roots, set());
      expect(computeUnwanted(g, next, set()).has(uid)).toBe(false);
    }
  });
});

describe('can breed now', () => {
  it('needs both parents owned and the bee wanted', () => {
    const have = set(id('Steadfast'), id('Valiant'));
    expect(canBreed(g, id('Heroic'), have, computeUnwanted(g, set(), have))).toBe(true);
    expect(canBreed(g, id('Heroic'), set(id('Steadfast')), new Map())).toBe(false);
    expect(canBreed(g, id('Heroic'), have, computeUnwanted(g, set(id('Heroic')), have))).toBe(
      false,
    );
  });
});

describe('search', () => {
  it('matches name, branch and products with every word', () => {
    const s = g.byId['gregtech.bee.speciesNaquadah'];
    expect(matchesSearch(s, searchWords('naquadah comb'))).toBe(true);
    expect(matchesSearch(s, searchWords('radioactive'))).toBe(true);
    expect(matchesSearch(s, searchWords('naquadah honey'))).toBe(false);
  });

  it('steps through a list one bee at a time', () => {
    const list = ['a', 'b', 'c'];
    expect(stepIn(list, 'b', 1)).toBe('c');
    expect(stepIn(list, 'b', -1)).toBe('a');
    expect(stepIn(list, 'c', 1)).toBeNull();
    expect(stepIn(list, 'a', -1)).toBeNull();
    expect(stepIn(list, 'x', 1)).toBe('a');
    expect(stepIn(list, 'x', -1)).toBe('a');
    expect(stepIn([], 'x', 1)).toBeNull();
  });
});
