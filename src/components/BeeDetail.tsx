import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { MODS, type Product } from '../lib/graph';
import { BeeImg, Chip, Conditions, pct } from './Bee';
import { RecipeTree, useTreeState } from './RecipeTree';
import { useVisibleRows } from './Sidebar';
import { g, ql, useStore } from '../store';
import { questPath } from '../routes';

const cap = (s: string | null) => (s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ') : '?');

function Products({ list }: { list: Product[] }) {
  if (!list.length) return <span className="empty">none</span>;
  return (
    <>
      {list.map((p) => (
        <span key={p.item} className="prod">
          {p.item} <span className="sub">{Math.round(p.chance * 1000) / 10}%</span>
        </span>
      ))}
    </>
  );
}

/** onList: show the bee list (phone layout, where the list replaces the detail) */
export function BeeDetail({ uid, onList }: { uid: string; onList: () => void }) {
  const { have, fav, unwanted, toggleFav, toggleHave, toggleNope, isCanBreed, setFilters } = useStore();
  const s = g.byId[uid];
  const rows = useVisibleRows();
  const tree = useTreeState(uid);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [uid]);

  const owned = have.has(uid);
  const nope = unwanted.get(uid);
  const otherCauses = nope ? [...nope].filter((r) => r !== uid) : [];
  const recipes = g.makes[uid];

  return (
    <div id="detail" ref={ref}>
      <div className="mbar">
        <button className="btn" onClick={onList}>
          ☰ Bees <span className="sub">{rows.length}</span>
        </button>
      </div>
      <div className="head">
        <BeeImg s={s} big />
        <div className="title">
          <h2>{s.name}</h2>
          <div className="sub">
            <i>
              {s.branchSci ?? ''} {s.binomial ?? ''}
            </i>{' '}
            · {MODS[s.mod] ?? s.mod} · branch{' '}
            {s.branch ? (
              <span
                className="qlink"
                title="Show only this branch in the list"
                onClick={() => {
                  setFilters((f) => ({ ...f, branches: new Set([s.branch!]) }));
                  onList();
                }}
              >
                {s.branch}
              </span>
            ) : (
              '?'
            )}
          </div>
        </div>
        <button className={'btn' + (fav.has(uid) ? ' fav' : '')} onClick={() => toggleFav(uid)} title="Bookmark this bee (F)">
          {fav.has(uid) ? '★ Bookmarked' : '☆ Bookmark'}
        </button>
        <button className={'btn' + (owned ? ' on' : '')} onClick={() => toggleHave(uid)} title="Mark bees you own (H)">
          {owned ? '✓ I have this' : '☐ I have this'}
        </button>
        {owned ? (
          <button className="btn" disabled style={{ opacity: 0.4, cursor: 'default' }} title="You have this bee, so it can't be not wanted">
            ☐ Not wanted
          </button>
        ) : (
          <button
            className={'btn' + (nope ? ' off' : '')}
            onClick={() => toggleNope(uid)}
            title={nope ? 'Click to want it again (also unmarks the bees that caused it)' : 'Not wanted: also marks bees that can only be bred from it (N)'}
          >
            {nope ? '✗ Not wanted' : '☐ Not wanted'}
          </button>
        )}
        {(ql.questOf[uid] ?? []).map((id) => (
          <Link key={id} className="btn" to={questPath(id)} title="Show this bee's quest">
            📖 {ql.byId[id].name}
          </Link>
        ))}
      </div>

      <div className="facts">
        <div className="fact"><b>Temperature</b>{cap(s.temp)}</div>
        <div className="fact"><b>Humidity</b>{cap(s.humidity)}</div>
        <div className="fact"><b>Products</b><Products list={s.products} /></div>
        <div className="fact"><b>Specialty</b><Products list={s.specialty} /></div>
        {s.nocturnal && <div className="fact"><b>Works</b>at night</div>}
        <div className="fact"><b>Gene</b>{s.dominant ? 'Dominant' : 'Recessive'}</div>
      </div>
      {s.description && <div className="desc">{s.description.split('|')[0]}</div>}

      <h3>
        How to get it
        {recipes.length > 0 && (
          <span className="tools">
            <button className="btn" onClick={tree.openAll}>Open all</button>
            <button className="btn" onClick={tree.closeAll}>Close all</button>
          </span>
        )}
      </h3>
      {nope && (
        <div className="note bad" style={{ marginBottom: 10 }}>
          {otherCauses.length ? (
            <>
              ✗ Not wanted: every way to breed it needs a not-wanted bee (from{' '}
              {otherCauses.map((r) => <Chip key={r} uid={r} />)}). Click "Not wanted" here to want it again; that also unmarks{' '}
              {otherCauses.length > 1 ? 'those bees' : 'that bee'}.
            </>
          ) : (
            '✗ You marked this bee as not wanted. Bees that can only be bred from it are marked too.'
          )}
        </div>
      )}
      {isCanBreed(uid) && (
        <div className="note" style={{ marginBottom: 10 }}>
          ⚗ You have both parents for this one. You can breed it now.
        </div>
      )}
      {recipes.length ? (
        <>
          <RecipeTree uid={uid} open={tree.open} toggle={tree.toggle} />
          <p className="sub">
            Click <b>+</b> to open a parent's recipes. <span className="leaf">base</span> = can't be bred, find it in the world. Click any bee
            name to jump to it.
          </p>
        </>
      ) : (
        <div className="note">
          This bee can't be bred. Find it in <b>hives in the world</b>, buy it from a <b>villager</b> (Apiarist), or get it another way (check
          NEI).
        </div>
      )}

      <h3>Breeds into ({g.usedIn[uid].length})</h3>
      {g.usedIn[uid].length ? (
        <div className="uses">
          {g.usedIn[uid].map((m, i) => (
            <div key={i}>
              <span className="recipe">
                <Chip uid={uid} />
                <span className="plus">+</span>
                <Chip uid={m.a === uid ? m.b : m.a} />
                <span className="arrow">→</span>
                <Chip uid={m.result} />
                <span className="chance">{pct(m.chance)}</span>
                <Conditions list={m.conditions} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">Nothing.</p>
      )}

      <div className="keys">
        <kbd>Backspace</kbd> back · <kbd>Shift</kbd>+<kbd>Backspace</kbd> forward · <kbd>/</kbd> search · <kbd>↑</kbd>
        <kbd>↓</kbd> move in list · <kbd>Enter</kbd> open first result · <kbd>Esc</kbd> clear search · <kbd>F</kbd> bookmark ·{' '}
        <kbd>H</kbd> I have this · <kbd>N</kbd> not wanted · mouse side buttons work too
      </div>
    </div>
  );
}
