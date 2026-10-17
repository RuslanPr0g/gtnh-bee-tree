import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { graph as g, questLine as ql } from './data';
import { MODS, canBreed, computeUnwanted, unmarkNope, type Unwanted } from './lib/graph';
import { KEYS, load, loadSet, save } from './lib/storage';

export const VIEWS = {
  all: 'All',
  fav: '★ Bookmarked',
  want: 'Hide ✗',
  have: '✓ I have',
  can: '⚗ Can breed now',
  base: '● Base only',
  nope: '✗ Not wanted',
} as const;
export type View = keyof typeof VIEWS;

export const MOD_KEYS = Object.keys(MODS).filter((k) => g.species.some((s) => s.mod === k));

export interface Filters {
  view: View;
  mods: Set<string>;
  branches: Set<string>;
  open: boolean;
}

function loadFilters(): Filters {
  const f = load<Record<string, unknown> | null>(KEYS.filters, null);
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null);
  const mods = arr(f?.mods);
  const br = arr(f?.br);
  return {
    view: typeof f?.view === 'string' && f.view in VIEWS ? (f.view as View) : 'all',
    mods: new Set(mods ? mods.filter((k) => MOD_KEYS.includes(k)) : MOD_KEYS),
    branches: new Set((br ?? []).filter((b) => g.species.some((s) => s.branch === b))),
    open: f?.open === true,
  };
}

function useStoreState() {
  const [have, setHave] = useState(() => loadSet(KEYS.have, (u) => !!g.byId[u]));
  // old saves could hold a bee in both lists: owning wins
  const [nope, setNope] = useState(() => {
    const h = loadSet(KEYS.have, (u) => !!g.byId[u]);
    return loadSet(KEYS.nope, (u) => !!g.byId[u] && !h.has(u));
  });
  const [fav, setFav] = useState(() => loadSet(KEYS.fav, (u) => !!g.byId[u]));
  const [filters, setFilters] = useState(loadFilters);
  const [query, setQuery] = useState('');
  // last bee / quest shown, so the tabs return to them
  const [lastBee, setLastBee] = useState<string | null>(null);
  const [lastQuest, setLastQuest] = useState<string | null>(null);

  useEffect(() => save(KEYS.have, [...have]), [have]);
  useEffect(() => save(KEYS.nope, [...nope]), [nope]);
  useEffect(() => save(KEYS.fav, [...fav]), [fav]);
  useEffect(
    () => save(KEYS.filters, { view: filters.view, mods: [...filters.mods], br: [...filters.branches], open: filters.open }),
    [filters],
  );

  const unwanted: Unwanted = useMemo(() => computeUnwanted(g, nope, have), [nope, have]);

  const toggleFav = useCallback((uid: string) => {
    setFav((f) => {
      const n = new Set(f);
      if (!n.delete(uid)) n.add(uid);
      return n;
    });
  }, []);

  const toggleHave = useCallback(
    (uid: string) => {
      if (have.has(uid)) {
        const n = new Set(have);
        n.delete(uid);
        setHave(n);
      } else {
        setHave(new Set(have).add(uid));
        // owning a bee clears its own not-wanted mark
        if (nope.has(uid)) {
          const n = new Set(nope);
          n.delete(uid);
          setNope(n);
        }
      }
    },
    [have, nope],
  );

  const toggleNope = useCallback(
    (uid: string) => {
      if (have.has(uid)) return;
      // unchecking also removes every marked bee that causes this one, so it really comes back
      if (unwanted.has(uid)) setNope(unmarkNope(g, uid, nope, have));
      else setNope(new Set(nope).add(uid));
    },
    [have, nope, unwanted],
  );

  const isCanBreed = useCallback((uid: string) => canBreed(g, uid, have, unwanted), [have, unwanted]);

  return {
    have, nope, fav, unwanted, filters, setFilters, query, setQuery,
    lastBee, setLastBee, lastQuest, setLastQuest, toggleFav, toggleHave, toggleNope, isCanBreed,
  };
}

export type Store = ReturnType<typeof useStoreState>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreState();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

export { g, ql };
