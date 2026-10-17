import { describe, expect, it } from 'vitest';
import { decodeSettings, encodeSettings } from './settings';

describe('settings link', () => {
  it('round-trips the saved keys', () => {
    const s = {
      gtnhBeesHave: ['forestry.speciesHeroic'],
      gtnhBeesNope: ['extrabees.species.growing'],
      gtnhBeesFav: [],
      gtnhBeesFilters: { view: 'fav', mods: ['forestry'], br: ['Noble'], open: true },
    };
    const d = encodeSettings(s);
    expect(d).toMatch(/^[\w-]+$/);
    expect(decodeSettings(d)).toEqual(s);
  });

  it('drops unknown keys and rejects junk', () => {
    expect(decodeSettings(encodeSettings({ gtnhBeesFav: ['x'], evil: 1 } as never))).toEqual({
      gtnhBeesFav: ['x'],
    });
    expect(decodeSettings('not base64!')).toBeNull();
    expect(decodeSettings(encodeSettings([] as never))).toBeNull();
  });
});
