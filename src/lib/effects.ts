// Bee effects (src/data/effects.json): what each effect allele does near the hive, in plain words.
// Which effect a bee has comes from its default genome (the "effect" field in bees.json).

/** danger: breaks or changes blocks, fire, explosions, hostile mobs · warn: hurts or bothers you */
export type EffectLevel = 'danger' | 'warn' | 'good' | 'info';

export interface EffectInfo {
  name: string;
  level: EffectLevel;
  text: string;
  /** a full Apiarist's suit protects you from it */
  suit?: boolean;
}
export type EffectData = Record<string, EffectInfo>;

export const NO_EFFECT = 'forestry.effectNone';

export const LEVEL_LABEL: Record<EffectLevel, string> = {
  danger: 'BE CAREFUL',
  warn: 'Careful',
  good: 'Helpful',
  info: 'Harmless',
};

/** The bee's effect, or null when it has none. */
export function effectOf(data: EffectData, effect: string | null): EffectInfo | null {
  if (!effect || effect === NO_EFFECT) return null;
  return data[effect] ?? null;
}

/** Effects worth a warning: they break things, spawn monsters or hurt you. */
export const isRisky = (e: EffectInfo | null) => e?.level === 'danger' || e?.level === 'warn';

/** Effect UIDs used by bees that have no entry in effects.json. */
export function missingEffects(data: EffectData, used: (string | null)[]): string[] {
  return [...new Set(used)].filter((u): u is string => !!u && u !== NO_EFFECT && !data[u]).sort();
}
