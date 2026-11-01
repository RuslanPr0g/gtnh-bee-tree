import { describe, expect, it } from 'vitest';
import raw from '../data/bees.json';
import combs from '../data/combs.json';
import { combRecipes, seconds, tier, type CombData, type CombRecipe } from './combs';

const r = (machine: string, item: string): CombRecipe => ({
  machine,
  eut: 5,
  ticks: 128,
  in: [{ item: 'X Comb', n: 1 }],
  fluidIn: [],
  out: [{ item, n: 1, chance: 0.5 }],
  fluidOut: [],
});

describe('comb recipes', () => {
  it('maps EU/t to voltage tiers', () => {
    expect(tier(0)).toBe(null);
    expect(tier(5)).toBe('ULV');
    expect(tier(30)).toBe('LV');
    expect(tier(120)).toBe('MV');
    expect(tier(1920)).toBe('EV');
    expect(tier(409600000)).toBe('UXV');
  });

  it('formats ticks as seconds', () => {
    expect(seconds(128)).toBe('6.4s');
    expect(seconds(20)).toBe('1s');
  });

  it('hides the Forestry centrifuge only when GregTech gives the same', () => {
    const data: CombData = {
      'X Comb': [r('Centrifuge', 'Dust'), r('Forestry Centrifuge', 'Dust')],
      'Y Comb': [r('Centrifuge', 'Dust'), r('Forestry Centrifuge', 'Wax')],
    };
    expect(combRecipes(data, 'X Comb').map((x) => x.machine)).toEqual(['Centrifuge']);
    expect(combRecipes(data, 'Y Comb')).toHaveLength(2);
    expect(combRecipes(data, 'Nope')).toEqual([]);
  });

  it('has recipes for nearly every comb a bee makes', () => {
    const made = new Set(
      raw.species.flatMap((s) => [...s.products, ...s.specialty].map((p) => p.item)),
    );
    const names = [...made].filter((n) => n.endsWith('Comb'));
    const missing = names.filter((n) => !(n in combs));
    expect(missing.length).toBeLessThan(names.length / 20);
  });
});
