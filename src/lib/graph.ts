// Bee species + mutation graph, and the rules for "not wanted" / "can breed now".
// Everything here is pure so it can be unit tested without a DOM.

export interface Product {
  item: string;
  chance: number;
}

export interface Species {
  uid: string;
  name: string;
  binomial: string | null;
  authority: string | null;
  description: string | null;
  branch: string | null;
  branchSci: string | null;
  temp: string | null;
  humidity: string | null;
  nocturnal: boolean;
  dominant: boolean;
  secret: boolean;
  glow: boolean;
  color: number;
  color2: number;
  products: Product[];
  specialty: Product[];
  mod: string;
}

export interface Mutation {
  a: string;
  b: string;
  result: string;
  chance: number;
  secret: boolean;
  conditions: string[];
}

export interface RawData {
  species: Omit<Species, 'mod'>[];
  mutations: Mutation[];
}

export interface Graph {
  species: Species[];
  sorted: Species[];
  byId: Record<string, Species>;
  /** recipes that produce a bee */
  makes: Record<string, Mutation[]>;
  /** recipes a bee is a parent in */
  usedIn: Record<string, Mutation[]>;
  dupNames: Record<string, number>;
}

export const MODS: Record<string, string> = {
  gregtech: 'GregTech',
  extrabees: 'Extra Bees',
  magicbees: 'Magic Bees',
  forestry: 'Forestry',
  gendustry: 'Gendustry',
  gtpp: 'GT++',
  computronics: 'Computronics',
};

// some mods leave untranslated keys like "for.genus.bees.radioactive"; turn those into plain words or drop them
const KEY_NAMES: Record<string, string> = {
  raremetal: 'Rare Metal',
  gtalloy: 'GT Alloy',
  noblegas: 'Noble Gas',
  hee: 'Hardcore Ender',
  preciousmetal: 'Precious Metal',
};
const isKey = (v: string | null): v is string => !!v && !/\s/.test(v) && /^\w+(\.\w+)+$/.test(v);
const fromKey = (v: string) => {
  const w = v.split('.').pop()!;
  return KEY_NAMES[w.toLowerCase()] ?? w.charAt(0).toUpperCase() + w.slice(1);
};

export function buildGraph(raw: RawData): Graph {
  const byId: Graph['byId'] = {};
  const makes: Graph['makes'] = {};
  const usedIn: Graph['usedIn'] = {};
  const dupNames: Graph['dupNames'] = {};
  const species = raw.species.map((s): Species => ({
    ...s,
    mod: s.uid.split('.')[0],
    branch: isKey(s.branch) ? fromKey(s.branch) : s.branch,
    description: isKey(s.description) ? null : s.description,
  }));
  for (const s of species) {
    byId[s.uid] = s;
    makes[s.uid] = [];
    usedIn[s.uid] = [];
    dupNames[s.name] = (dupNames[s.name] ?? 0) + 1;
  }
  for (const m of raw.mutations) {
    if (!byId[m.a] || !byId[m.b] || !byId[m.result]) continue;
    makes[m.result].push(m);
    usedIn[m.a].push(m);
    if (m.b !== m.a) usedIn[m.b].push(m);
  }
  const sorted = species.slice().sort((x, y) => x.name.localeCompare(y.name));
  return { species, sorted, byId, makes, usedIn, dupNames };
}

/** every bee in the recursive "how to get it" tree of uid (not uid itself, unless it is its own ancestor) */
export function ancestors(g: Graph, uid: string): Set<string> {
  const seen = new Set<string>();
  const todo = [uid];
  while (todo.length) {
    for (const m of g.makes[todo.pop()!] ?? []) {
      for (const p of [m.a, m.b]) {
        if (!seen.has(p)) {
          seen.add(p);
          todo.push(p);
        }
      }
    }
  }
  return seen;
}

/** uid -> Set of roots that cause it */
export type Unwanted = Map<string, Set<string>>;

/**
 * "Not wanted": the bees you mark (roots), plus every bee that can ONLY be bred with a not-wanted
 * parent (each of its recipes needs one), repeated until nothing changes. Never marks the ancestors
 * of a root ("how to get it") and never bees you already have.
 */
export function computeUnwanted(g: Graph, nope: Set<string>, have: Set<string>): Unwanted {
  const unwanted: Unwanted = new Map();
  const roots = [...nope].filter((r) => g.byId[r] && !have.has(r));
  const keep = new Set<string>();
  for (const r of roots) for (const a of ancestors(g, r)) keep.add(a);
  for (const r of roots) unwanted.set(r, new Set([r]));
  // grow to a fixpoint; cause sets only ever grow, so this ends
  for (let changed = true; changed; ) {
    changed = false;
    for (const s of g.species) {
      const x = s.uid;
      const recipes = g.makes[x];
      if (have.has(x) || !recipes.length || (keep.has(x) && !nope.has(x))) continue;
      if (!recipes.every((m) => unwanted.has(m.a) || unwanted.has(m.b))) continue;
      const causes = new Set(unwanted.get(x) ?? []);
      for (const m of recipes)
        for (const p of [m.a, m.b]) for (const c of unwanted.get(p) ?? []) causes.add(c);
      if (!unwanted.has(x) || causes.size > unwanted.get(x)!.size) {
        unwanted.set(x, causes);
        changed = true;
      }
    }
  }
  return unwanted;
}

/** new root set after the user wants `uid` again: removes every root causing it, until it is wanted */
export function unmarkNope(g: Graph, uid: string, nope: Set<string>, have: Set<string>): Set<string> {
  const next = new Set(nope);
  let unwanted = computeUnwanted(g, next, have);
  // repeat in case another root still reaches it (bounded by the number of roots)
  for (let i = 0; unwanted.has(uid) && i <= nope.size + 1; i++) {
    for (const root of unwanted.get(uid)!) next.delete(root);
    unwanted = computeUnwanted(g, next, have);
  }
  return next;
}

export const canBreed = (g: Graph, uid: string, have: Set<string>, unwanted: Unwanted) =>
  !have.has(uid) && !unwanted.has(uid) && g.makes[uid].some((m) => have.has(m.a) && have.has(m.b));

export function matchesSearch(s: Species, words: string[]): boolean {
  if (!words.length) return true;
  const hay = [
    s.name,
    s.binomial,
    s.branch,
    s.branchSci,
    MODS[s.mod],
    ...s.products.map((p) => p.item),
    ...s.specialty.map((p) => p.item),
  ]
    .join(' ')
    .toLowerCase();
  return words.every((w) => hay.includes(w));
}

export const searchWords = (q: string) => q.trim().toLowerCase().split(/\s+/).filter(Boolean);
