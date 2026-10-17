import { describe, expect, it } from 'vitest';
import { beePath, legacyTarget, questPath } from './routes';

const isBee = (u: string) => u === 'forestry.speciesHeroic';
const isQuest = (q: string) => q === '0:358';

describe('routes', () => {
  it('builds encoded paths', () => {
    expect(beePath('forestry.speciesHeroic')).toBe('/bee/forestry.speciesHeroic');
    expect(questPath('0:358')).toBe('/quest/0%3A358');
  });

  it('redirects links from the old single-file page', () => {
    expect(legacyTarget('/b:forestry.speciesHeroic', isBee, isQuest)).toBe('/bee/forestry.speciesHeroic');
    expect(legacyTarget('/q%3A0%3A358', isBee, isQuest)).toBe('/quest/0%3A358');
    expect(legacyTarget('/forestry.speciesHeroic', isBee, isQuest)).toBe('/bee/forestry.speciesHeroic');
    expect(legacyTarget('/nope', isBee, isQuest)).toBeNull();
    expect(legacyTarget('/%E0%A4%A', isBee, isQuest)).toBeNull();
  });
});
