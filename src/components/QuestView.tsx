import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { searchWords } from '../lib/graph';
import { questDone, questMatches, questPath as pathTo, type Quest } from '../lib/quests';
import { questPath } from '../routes';
import { BeeImg, Chip } from './Bee';
import { g, ql, useStore } from '../store';

const center = (n: Quest) => [n.px + n.ps / 2, n.py + n.ps / 2] as const;

function QuestMap({ id, path }: { id: string; path: Set<string> }) {
  const { have, unwanted, query } = useStore();
  const words = useMemo(() => searchWords(query), [query]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current
      ?.querySelector('.qn.sel')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [id]);
  return (
    <div id="qmap" ref={ref}>
      <div className="qinner" style={{ width: ql.width, height: ql.height }}>
        <svg width={ql.width} height={ql.height}>
          {ql.nodes.flatMap((n) =>
            n.pre
              .filter((p) => ql.byId[p])
              .map((p) => {
                const [x1, y1] = center(ql.byId[p]);
                const [x2, y2] = center(n);
                return (
                  <line
                    key={p + '>' + n.id}
                    className={path.has(p) && path.has(n.id) ? 'hot' : ''}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                  />
                );
              }),
          )}
        </svg>
        {ql.nodes.map((n) => {
          const cls = [
            'qn',
            n.id === id && 'sel',
            path.has(n.id) && n.id !== id && 'path',
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
              title={n.name}
              to={questPath(n.id)}
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

function QuestPanel({ id, path }: { id: string; path: string[] }) {
  const { have } = useStore();
  const n = ql.byId[id];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [id]);
  return (
    <div id="qpanel" ref={ref}>
      <div className="sub">{ql.name}</div>
      <h2>{n.name}</h2>
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
      <div className="qlegend">
        Gold = path to the picked quest · green = you have all its bees (mark them with "I have
        this") · click a bee to open its breeding tree · search box dims other quests
      </div>
    </div>
  );
}

export function QuestView({ id }: { id: string }) {
  const path = useMemo(() => pathTo(ql, id), [id]);
  const pathSet = useMemo(() => new Set(path), [path]);
  return (
    <section id="questView">
      <QuestMap id={id} path={pathSet} />
      <QuestPanel id={id} path={path} />
    </section>
  );
}
