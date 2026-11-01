import { describe, expect, it } from 'vitest';
import raw from '../data/bees.json';
import effects from '../data/effects.json';
import { effectOf, isRisky, missingEffects, NO_EFFECT, type EffectData } from './effects';

const data = effects as EffectData;

describe('bee effects', () => {
  it('describes every effect a bee has (fill in src/data/effects.json after a data update)', () => {
    expect(
      missingEffects(
        data,
        raw.species.map((s) => s.effect),
      ),
    ).toEqual([]);
  });

  it('has no entries for effects no bee has', () => {
    const used = new Set(raw.species.map((s) => s.effect));
    expect(Object.keys(data).filter((u) => !used.has(u))).toEqual([]);
  });

  it('uses only known levels and never leaves a text empty', () => {
    for (const e of Object.values(data)) {
      expect(['danger', 'warn', 'good', 'info']).toContain(e.level);
      expect(e.name && e.text).toBeTruthy();
    }
  });

  it('treats "None" and missing as no effect', () => {
    expect(effectOf(data, NO_EFFECT)).toBeNull();
    expect(effectOf(data, null)).toBeNull();
    expect(effectOf(data, 'nope.unknown')).toBeNull();
  });

  it('flags block-breaking and harmful effects, not helpful ones', () => {
    expect(isRisky(effectOf(data, 'forestry.effectRadioactive'))).toBe(true);
    expect(isRisky(effectOf(data, 'magicbees.effectAblaze'))).toBe(true);
    expect(isRisky(effectOf(data, 'forestry.effectIgnition'))).toBe(true);
    expect(isRisky(effectOf(data, 'forestry.effectBeatific'))).toBe(false);
    expect(isRisky(null)).toBe(false);
  });
});
