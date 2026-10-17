import { useState } from 'react';
import type { Mutation } from '../lib/graph';
import { Chip, Conditions, pct } from './Bee';
import { g } from '../store';

// Ancestry tree: each bee node lists the recipes that make it; each recipe lists its two parents.
// A node is identified by its path from the root ("root|parent|grandparent"), so the same bee can
// be open in one branch and closed in another. Parents already on the path are not expanded (cycles).

const keyOf = (path: string[]) => path.join('|');
/** by default the root's direct parents are open */
const defaultOpen = (rootUid: string) =>
  new Set(
    g.makes[rootUid].flatMap((m) =>
      [m.a, m.b].filter((p) => p !== rootUid && g.makes[p].length).map((p) => keyOf([rootUid, p])),
    ),
  );

/** open every node breadth-first; capped so huge trees stay fast */
function allOpen(rootUid: string, cap = 300): Set<string> {
  const open = new Set<string>();
  const queue: string[][] = [[rootUid]];
  while (queue.length && open.size < cap) {
    const path = queue.shift()!;
    for (const m of g.makes[path[path.length - 1]]) {
      for (const p of new Set([m.a, m.b])) {
        if (path.includes(p) || !g.makes[p].length) continue;
        const next = [...path, p];
        const k = keyOf(next);
        if (open.has(k)) continue;
        open.add(k);
        queue.push(next);
      }
    }
  }
  return open;
}

function Parent({ uid, path }: { uid: string; path: string[] }) {
  return (
    <>
      <Chip uid={uid} />
      {!g.makes[uid].length ? (
        <span className="leaf" title="Cannot be bred: found in the world or traded">
          base
        </span>
      ) : path.includes(uid) ? (
        <span className="loop" title="Already shown above">
          ↺
        </span>
      ) : null}
    </>
  );
}

interface TreeProps {
  open: Set<string>;
  toggle: (k: string) => void;
}

function Recipe({ m, path, ...t }: { m: Mutation; path: string[] } & TreeProps) {
  const kids = [...new Set([m.a, m.b])].filter((x) => g.makes[x].length && !path.includes(x));
  return (
    <li>
      <span className="recipe">
        <Parent uid={m.a} path={path} />
        <span className="plus">+</span>
        <Parent uid={m.b} path={path} />
        <span className="arrow">→</span>
        <span className="chance">{pct(m.chance)}</span>
        <Conditions list={m.conditions} />
      </span>
      {kids.length > 0 && (
        <ul>
          {kids.map((k) => (
            <Node key={k} uid={k} path={[...path, k]} {...t} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Node({ uid, path, open, toggle }: { uid: string; path: string[] } & TreeProps) {
  const k = keyOf(path);
  const isOpen = open.has(k);
  return (
    <li>
      <button className="tog" onClick={() => toggle(k)}>
        {isOpen ? '−' : '+'}
      </button>{' '}
      <span className="sub">how to make</span> <Chip uid={uid} />
      {isOpen && (
        <ul>
          {g.makes[uid].map((m, i) => (
            <Recipe key={i} m={m} path={path} open={open} toggle={toggle} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function useTreeState(rootUid: string) {
  const [state, setState] = useState(() => ({ root: rootUid, open: defaultOpen(rootUid) }));
  // reset when another bee is shown
  const open = state.root === rootUid ? state.open : defaultOpen(rootUid);
  if (state.root !== rootUid) setState({ root: rootUid, open });
  return {
    open,
    toggle: (k: string) =>
      setState((s) => {
        const n = new Set(s.open);
        if (!n.delete(k)) n.add(k);
        return { ...s, open: n };
      }),
    openAll: () => setState({ root: rootUid, open: allOpen(rootUid) }),
    closeAll: () => setState({ root: rootUid, open: defaultOpen(rootUid) }),
  };
}

export function RecipeTree({ uid, open, toggle }: { uid: string } & TreeProps) {
  return (
    <div className="tree">
      <ul>
        {g.makes[uid].map((m, i) => (
          <Recipe key={i} m={m} path={[uid]} open={open} toggle={toggle} />
        ))}
      </ul>
    </div>
  );
}
