// What each comb turns into in machines (src/data/combs.json, made by tools/combdump-agent).

export interface Stack {
  item: string;
  n: number;
  chance?: number;
}
export interface Fluid {
  item: string;
  mb: number;
}
export interface CombRecipe {
  machine: string;
  eut: number;
  ticks: number;
  in: Stack[];
  fluidIn: Fluid[];
  out: Stack[];
  fluidOut: Fluid[];
}
export type CombData = Record<string, CombRecipe[]>;

const TIERS = [
  'ULV',
  'LV',
  'MV',
  'HV',
  'EV',
  'IV',
  'LuV',
  'ZPM',
  'UV',
  'UHV',
  'UEV',
  'UIV',
  'UMV',
  'UXV',
];

/** GregTech voltage tier for a recipe's EU/t (8 × 4^n), or null for unpowered machines. */
export function tier(eut: number): string | null {
  if (eut <= 0) return null;
  for (let i = 0; i < TIERS.length; i++) if (eut <= 8 * 4 ** i) return TIERS[i];
  return 'MAX';
}

export const seconds = (ticks: number) => Math.round(ticks / 2) / 10 + 's';

const outKey = (r: CombRecipe) => JSON.stringify([r.out, r.fluidOut]);

/** Recipes for a comb, dropping the Forestry centrifuge when a GregTech centrifuge gives the same. */
export function combRecipes(data: CombData, comb: string): CombRecipe[] {
  const list = data[comb] ?? [];
  const gt = new Set(list.filter((r) => r.machine === 'Centrifuge').map(outKey));
  return list.filter((r) => r.machine !== 'Forestry Centrifuge' || !gt.has(outKey(r)));
}
