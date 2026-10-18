import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { searchWords } from '../lib/graph';
import { questDone, questEdges, questMatches, questPath as pathTo } from '../lib/quests';
import { QUESTS, questPath } from '../links';
import { BeeImg, Chip } from './Bee';
import { g, ql, useStore } from '../store';

const EDGES = questEdges(ql);
const KINDS = ['far', 'base', 'next', 'hot', 'hov'] as const;

/** phone: how the screen is split between the map and the panel */
type Mode = 'map' | 'split' | 'info';
const MODES: [Mode, string][] = [
  ['map', 'Map'],
  ['split', 'Both'],
  ['info', 'Details'],
];

interface MapProps {
  id: string | null;
  path: Set<string>;
  mode: Mode;
}

function QuestMap({ id, path, mode }: MapProps) {
  const { have, unwanted, query } = useStore();
  const words = useMemo(() => searchWords(query), [query]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const next = new Set(id ? ql.byId[id].next : []);
  const kind = (e: (typeof EDGES)[number]): (typeof KINDS)[number] =>
    e.from === hover || e.to === hover
      ? 'hov'
      : path.has(e.from) && path.has(e.to)
        ? 'hot'
        : e.from === id
          ? 'next'
          : id
            ? 'far'
            : 'base';
  const edges = EDGES.map((e) => ({ ...e, k: kind(e) }));
  // highlighted lines are drawn last, on top of the others
  edges.sort((a, b) => KINDS.indexOf(a.k) - KINDS.indexOf(b.k));
  // a click on the empty map clears the pick
  const clear = (e: MouseEvent) => {
    if (id && !(e.target as Element).closest('.qn')) navigate(QUESTS);
  };
  useEffect(() => {
    ref.current
      ?.querySelector('.qn.sel')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    // also when the phone map is shown again or resized
  }, [id, mode]);
  return (
    <div id="qmap" ref={ref} onClick={clear}>
      <div className="qinner" style={{ width: ql.width, height: ql.height }}>
        <svg width={ql.width} height={ql.height}>
          <defs>
            {KINDS.map((a) => (
              <marker
                key={a}
                id={'qa-' + a}
                className={a}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M0 0 10 5 0 10z" />
              </marker>
            ))}
          </defs>
          {edges.map((e) => (
            <line
              key={e.from + '>' + e.to}
              className={e.k}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              markerEnd={`url(#qa-${e.k})`}
            />
          ))}
        </svg>
        {ql.nodes.map((n) => {
          const cls = [
            'qn',
            n.id === id && 'sel',
            path.has(n.id) && n.id !== id && 'path',
            next.has(n.id) && 'next',
            id && !path.has(n.id) && !next.has(n.id) && 'far',
            questDone(n, have) && 'own',
            n.main && unwanted.has(n.main) && 'no',
            !questMatches(n, g, words) && 'dim',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <Link
              key={n.id}
              className={cls}
              title={n.id === id ? `${n.name} (click again to clear)` : n.name}
              to={n.id === id ? QUESTS : questPath(n.id)}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              style={{ left: n.px, top: n.py, width: n.ps, height: n.ps }}
            >
              {n.main ? <BeeImg s={g.byId[n.main]} /> : n.name.slice(0, 2)}
              {n.w >= 48 && <span className="lbl">{n.name}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function QuestItem({ id }: { id: string }) {
  const { have } = useStore();
  const n = ql.byId[id];
  if (!n)
    return (
      <li>
        {ql.extern[id] ?? id} <span className="sub">(other questline)</span>
      </li>
    );
  const done = questDone(n, have);
  return (
    <li className={done ? 'own' : ''}>
      {n.main && <BeeImg s={g.byId[n.main]} />}{' '}
      <Link className="qlink" to={questPath(id)}>
        {n.name}
      </Link>
      {done && <span className="have"> ✓</span>}
    </li>
  );
}

interface PanelProps {
  id: string | null;
  path: string[];
  mode: Mode;
  setMode: (m: Mode) => void;
}

const Legend = () => (
  <div className="qlegend">
    Gold = path to the picked quest · dashed = what it unlocks · green = you have all its bees (mark
    them with "I have this") · hover a quest to see its links · click a bee to open its breeding
    tree · search box dims other quests
  </div>
);

function Overview() {
  const { have } = useStore();
  const done = ql.nodes.filter((n) => questDone(n, have)).length;
  const withBees = ql.nodes.filter((n) => n.bees.length).length;
  return (
    <>
      <h2>{ql.name}</h2>
      <div className="qdesc">{ql.desc}</div>
      <p>
        {ql.nodes.length} quests · you have the bees for {done} of {withBees}
      </p>
      <p className="sub">
        Pick a quest on the map to see the path to it, what it needs and what it unlocks.
      </p>
      <Legend />
    </>
  );
}

function ModeSwitch({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <span className="seg" role="group" aria-label="Show">
      {MODES.map(([m, label]) => (
        <button
          key={m}
          className={mode === m ? 'on' : ''}
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
        >
          {label}
        </button>
      ))}
    </span>
  );
}

const ClearButton = () => (
  <Link className="btn qunpick" to={QUESTS} title="Clear the picked quest (Esc)">
    ✕<span className="lbl"> Clear</span>
  </Link>
);

function QuestPanel({ id, path, mode, setMode }: PanelProps) {
  const { have } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [id]);
  if (!id)
    return (
      <div id="qpanel" ref={ref}>
        <div className="qhead">
          <span className="qname">
            <b>Pick a quest</b>
          </span>
          <ModeSwitch mode={mode} setMode={setMode} />
        </div>
        <Overview />
      </div>
    );
  const n = ql.byId[id];
  return (
    <div id="qpanel" ref={ref}>
      {/* phone only: the picked quest and the map / details switch */}
      <div className="qhead">
        <span className="qname">
          {n.main && <BeeImg s={g.byId[n.main]} />}
          <b>{n.name}</b>
          {questDone(n, have) && <span className="have"> ✓</span>}
        </span>
        <ClearButton />
        <ModeSwitch mode={mode} setMode={setMode} />
      </div>
      <div className="sub">{ql.name}</div>
      <div className="qtitle">
        <h2>{n.name}</h2>
        <ClearButton />
      </div>
      {n.bees.length > 0 && (
        <>
          <h3>Bees to hand in</h3>
          <div className="uses">
            {n.bees.map((b) => (
              <div key={b}>
                <Chip uid={b} />
                {have.has(b) && <span className="have"> ✓ have</span>}
              </div>
            ))}
          </div>
        </>
      )}
      <div className="qdesc">{n.desc}</div>
      <h3>Path to this quest ({path.length} steps)</h3>
      <ol className="steps">
        {path.map((p) => (
          <QuestItem key={p} id={p} />
        ))}
      </ol>
      {n.pre.length > 0 && (
        <>
          <h3>Needs</h3>
          <ul className="steps">
            {n.pre.map((p) => (
              <QuestItem key={p} id={p} />
            ))}
          </ul>
        </>
      )}
      {n.next.length > 0 && (
        <>
          <h3>Unlocks</h3>
          <ul className="steps">
            {n.next.map((p) => (
              <QuestItem key={p} id={p} />
            ))}
          </ul>
        </>
      )}
      <Legend />
    </div>
  );
}

/** id: the picked quest, or null for the map with nothing picked */
export function QuestView({ id }: { id: string | null }) {
  const path = useMemo(() => (id ? pathTo(ql, id) : []), [id]);
  const pathSet = useMemo(() => new Set(path), [path]);
  const [mode, setMode] = useState<Mode>('split');
  const { query } = useStore();
  const navigate = useNavigate();
  const latest = useRef({ id, query });
  latest.current = { id, query };
  // Esc clears the search first (useKeys), then the picked quest
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (e.key !== 'Escape' || t?.matches('input, textarea, select')) return;
      if (latest.current.id && !latest.current.query) navigate(QUESTS);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);
  return (
    <section id="questView" className={'m-' + mode}>
      <QuestMap id={id} path={pathSet} mode={mode} />
      <QuestPanel id={id} path={path} mode={mode} setMode={setMode} />
    </section>
  );
}
