import { Link } from 'react-router';
import { MODS, type Species } from '../lib/graph';
import { g, useStore } from '../store';
import { beePath } from '../links';

const ICONS = g.species.length;

/** the bee's icon: one row of the sprite built by tools/build-icons.mjs */
export function BeeImg({ s, big }: { s: Species; big?: boolean }) {
  return (
    <span
      className={big ? 'hex big' : 'hex'}
      aria-hidden
      style={{
        backgroundSize: `100% ${ICONS * 100}%`,
        backgroundPosition: `0 ${(s.icon / (ICONS - 1)) * 100}%`,
      }}
    />
  );
}

/** bee name with the mod added when two mods use the same name */
export const beeLabel = (s: Species) =>
  s.name + (g.dupNames[s.name] > 1 ? ` (${MODS[s.mod] ?? s.mod})` : '');

/** link to a bee's page (middle-click opens a new tab) */
export function Chip({ uid }: { uid: string }) {
  const { have, unwanted } = useStore();
  const s = g.byId[uid];
  if (!s) return null;
  const cls = 'chip' + (have.has(uid) ? ' own' : '') + (unwanted.has(uid) ? ' no' : '');
  return (
    <Link className={cls} title={`${MODS[s.mod] ?? s.mod} · ${s.branch ?? ''}`} to={beePath(uid)}>
      <BeeImg s={s} />
      {beeLabel(s)}
    </Link>
  );
}

export function Conditions({ list }: { list: string[] }) {
  return (
    <>
      {list.map((c) => (
        <span key={c} className="cond">
          {c}
        </span>
      ))}
    </>
  );
}

export const pct = (c: number) => Math.round(c * 100) / 100 + '%';
