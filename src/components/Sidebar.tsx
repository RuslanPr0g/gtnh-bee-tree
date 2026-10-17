import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { MODS, matchesSearch, searchWords, type Species } from '../lib/graph';
import { BeeImg } from './Bee';
import { MOD_KEYS, VIEWS, g, useStore, type Filters, type View } from '../store';
import { beePath } from '../routes';

/** the bees the list shows, in order (also used for arrow-key navigation) */
export function useVisibleRows(): Species[] {
  const { filters, query, have, fav, unwanted, isCanBreed } = useStore();
  return useMemo(() => {
    const words = searchWords(query);
    const inView = (s: Species): boolean => {
      switch (filters.view) {
        case 'all':
          return true;
        case 'fav':
          return fav.has(s.uid);
        case 'want':
          return !unwanted.has(s.uid);
        case 'have':
          return have.has(s.uid);
        case 'can':
          return isCanBreed(s.uid);
        case 'base':
          return !g.makes[s.uid].length;
        case 'nope':
          return unwanted.has(s.uid);
      }
    };
    return g.sorted.filter(
      (s) =>
        filters.mods.has(s.mod) &&
        (!filters.branches.size || (s.branch != null && filters.branches.has(s.branch))) &&
        inView(s) &&
        matchesSearch(s, words),
    );
  }, [filters, query, have, fav, unwanted, isCanBreed]);
}

const MOD_COUNTS = Object.fromEntries(
  MOD_KEYS.map((k) => [k, g.species.filter((s) => s.mod === k).length]),
);

function FilterPanel() {
  const { filters, setFilters } = useStore();
  const [branchQuery, setBranchQuery] = useState('');
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggle = (s: Set<string>, v: string) => {
    const n = new Set(s);
    if (!n.delete(v)) n.add(v);
    return n;
  };

  // branches of the shown mods, with counts; picked ones always stay visible
  const branches = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of g.species)
      if (filters.mods.has(s.mod) && s.branch) counts[s.branch] = (counts[s.branch] ?? 0) + 1;
    for (const b of filters.branches) counts[b] ??= 0;
    const bt = branchQuery.trim().toLowerCase();
    return Object.keys(counts)
      .filter((b) => filters.branches.has(b) || !bt || b.toLowerCase().includes(bt))
      .sort((a, b) => a.localeCompare(b))
      .map((b) => [b, counts[b]] as const);
  }, [filters.mods, filters.branches, branchQuery]);

  return (
    <div id="fpanel">
      <div className="fsec">
        <div className="fhead">
          Mods
          <span className="flinks">
            <button onClick={() => set({ mods: new Set(MOD_KEYS) })}>all</button>
            <button onClick={() => set({ mods: new Set() })}>none</button>
          </span>
        </div>
        <div className="fchips">
          {MOD_KEYS.map((k) => (
            <button
              key={k}
              className={filters.mods.has(k) ? 'on' : ''}
              onClick={() => set({ mods: toggle(filters.mods, k) })}
            >
              {MODS[k]}
              <i>{MOD_COUNTS[k]}</i>
            </button>
          ))}
        </div>
      </div>
      <div className="fsec">
        <div className="fhead">
          Branches <span className="sub">none picked = all</span>
          <span className="flinks">
            <button onClick={() => set({ branches: new Set() })}>clear</button>
          </span>
        </div>
        <input
          id="bq"
          value={branchQuery}
          onChange={(e) => setBranchQuery(e.target.value)}
          placeholder="Find a branch…"
        />
        <div className="fchips scroll">
          {branches.length ? (
            branches.map(([b, n]) => (
              <button
                key={b}
                className={filters.branches.has(b) ? 'on' : ''}
                onClick={() => set({ branches: toggle(filters.branches, b) })}
              >
                {b}
                <i>{n}</i>
              </button>
            ))
          ) : (
            <span className="sub">No branch matches</span>
          )}
        </div>
      </div>
      <button
        className="btn"
        onClick={() => {
          setBranchQuery('');
          set({ view: 'all', mods: new Set(MOD_KEYS), branches: new Set() });
        }}
      >
        Reset all filters
      </button>
    </div>
  );
}

function FilterBar() {
  const { filters, setFilters } = useStore();
  const modsOff = filters.mods.size < MOD_KEYS.length;
  const n = (modsOff ? 1 : 0) + filters.branches.size;
  return (
    <div id="filters">
      <div className="frow">
        <select
          id="view"
          value={filters.view}
          onChange={(e) => setFilters((f) => ({ ...f, view: e.target.value as View }))}
          title="Show"
        >
          {Object.entries(VIEWS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button
          className={'fbtn' + (n ? ' act' : '')}
          aria-expanded={filters.open}
          onClick={() => setFilters((f) => ({ ...f, open: !f.open }))}
        >
          Filters{n ? ` (${n})` : ''} {filters.open ? '▴' : '▾'}
        </button>
      </div>
      {filters.open && <FilterPanel />}
      {(modsOff || filters.branches.size > 0) && (
        <div id="active">
          {modsOff && (
            <button
              title="Show all mods"
              onClick={() => setFilters((f) => ({ ...f, mods: new Set(MOD_KEYS) }))}
            >
              Mods: {filters.mods.size} of {MOD_KEYS.length} ×
            </button>
          )}
          {[...filters.branches].map((b) => (
            <button
              key={b}
              title="Remove"
              onClick={() =>
                setFilters((f) => {
                  const branches = new Set(f.branches);
                  branches.delete(b);
                  return { ...f, branches };
                })
              }
            >
              {b} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BeeList({ current, onPick }: { current: string; onPick: () => void }) {
  const { have, fav, unwanted, toggleFav, filters } = useStore();
  const rows = useVisibleRows();
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelector('.row.sel')?.scrollIntoView({ block: 'nearest' });
  }, [current]);
  return (
    <div id="list" ref={listRef}>
      <div className="count">
        {rows.length} bees
        {filters.view === 'have' && !rows.length ? ' — open a bee and press "I have this"' : ''}
        {filters.view === 'fav' && !rows.length ? ' — open a bee and press "Bookmark"' : ''}
      </div>
      {rows.map((s) => (
        <Link
          key={s.uid}
          className={'row' + (current === s.uid ? ' sel' : '') + (unwanted.has(s.uid) ? ' no' : '')}
          to={beePath(s.uid)}
          onClick={onPick}
        >
          <BeeImg s={s} />
          <span>
            {s.name}
            {!g.makes[s.uid].length && <span className="base"> ● base</span>}
            {have.has(s.uid) && <span className="have"> ✓</span>}
            {unwanted.has(s.uid) && <span className="nope"> ✗</span>}
          </span>
          <span className="tag">{MODS[s.mod] ?? s.mod}</span>
          <span
            className={'star' + (fav.has(s.uid) ? ' on' : '')}
            title="Bookmark (F)"
            onClick={(e) => {
              // the star sits inside the row link: don't navigate
              e.preventDefault();
              e.stopPropagation();
              toggleFav(s.uid);
            }}
          >
            {fav.has(s.uid) ? '★' : '☆'}
          </span>
        </Link>
      ))}
    </div>
  );
}

/** onClose: back to the bee (phone layout, where the list replaces the detail) */
export function Sidebar({ current, onClose }: { current: string; onClose: () => void }) {
  const s = g.byId[current];
  return (
    <aside id="side">
      <div className="mbar">
        <button className="btn" onClick={onClose}>
          ← <BeeImg s={s} /> {s.name}
        </button>
      </div>
      <FilterBar />
      <BeeList current={current} onPick={onClose} />
    </aside>
  );
}
