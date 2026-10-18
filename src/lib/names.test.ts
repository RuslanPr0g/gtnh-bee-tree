import { describe, expect, it } from 'vitest';
import raw from '../data/bees.json';
import meanings from '../data/names.json';
import { missingMeanings, translateUrl } from './names';

describe('bee name meanings', () => {
  it('has a meaning for every bee name (run tools/bee-names.mjs after a data update)', () => {
    expect(
      missingMeanings(
        raw.species.map((s) => s.name),
        meanings,
      ),
    ).toEqual([]);
  });

  it('has no meanings for names that are gone', () => {
    const names = new Set(raw.species.map((s) => s.name));
    expect(Object.keys(meanings).filter((n) => !names.has(n))).toEqual([]);
  });

  it('builds a Google Translate link with the text filled in', () => {
    expect(translateUrl('Big Bad')).toBe(
      'https://translate.google.com/?sl=auto&op=translate&text=Big%20Bad',
    );
  });
});
