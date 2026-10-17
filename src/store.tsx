import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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

const DEFAULT_FILTERS: Filters = {
  view: 'all',
  mods: new Set(MOD_KEYS),
  branches: new Set(),
  open: false,
};

// on the server (prerender) there is no window: layout effects must not run there
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function loadFilters(): Filters {
  const f = load<Record<string, unknown> | null>(KEYS.filters, null);
  const arr = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null;
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
  // Pages are prerendered without the user's data, so state starts empty (matching the HTML) and the
  // saved values load right after hydration, before the browser paints.
  const [loaded, setLoaded] = useState(false);
  const [have, setHave] = useState(() => new Set<string>());
  const [nope, setNope] = useState(() => new Set<string>());
  const [fav, setFav] = useState(() => new Set<string>());
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [query, setQuery] = useState('');

  const reload = useCallback(() => {
    const h = loadSet(KEYS.have, (u) => !!g.byId[u]);
    setHave(h);
    // old saves could hold a bee in both lists: owning wins
    setNope(loadSet(KEYS.nope, (u) => !!g.byId[u] && !h.has(u)));
    setFav(loadSet(KEYS.fav, (u) => !!g.byId[u]));
    setFilters(loadFilters());
    setLoaded(true);
  }, []);
  useClientLayoutEffect(reload, [reload]);
  // last bee / quest shown, so the tabs return to them
  const [lastBee, setLastBee] = useState<string | null>(null);
  const [lastQuest, setLastQuest] = useState<string | null>(null);

  // save only after loading, so the empty first state never overwrites saved data
  useEffect(() => {
    if (loaded) save(KEYS.have, [...have]);
  }, [loaded, have]);
  useEffect(() => {
    if (loaded) save(KEYS.nope, [...nope]);
  }, [loaded, nope]);
  useEffect(() => {
    if (loaded) save(KEYS.fav, [...fav]);
  }, [loaded, fav]);
  useEffect(() => {
    if (loaded)
      save(KEYS.filters, {
        view: filters.view,
        mods: [...filters.mods],
        br: [...filters.branches],
        open: filters.open,
      });
  }, [loaded, filters]);

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

  const isCanBreed = useCallback(
    (uid: string) => canBreed(g, uid, have, unwanted),
    [have, unwanted],
  );

  return {
    loaded,
    reload,
    have,
    nope,
    fav,
    unwanted,
    filters,
    setFilters,
    query,
    setQuery,
    lastBee,
    setLastBee,
    lastQuest,
    setLastQuest,
    toggleFav,
    toggleHave,
    toggleNope,
    isCanBreed,
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
