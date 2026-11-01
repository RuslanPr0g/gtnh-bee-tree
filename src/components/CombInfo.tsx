import { Fragment } from 'react';
import { combs } from '../data';
import { combRecipes, seconds, tier, type Fluid, type Stack } from '../lib/combs';

const amount = (s: Stack) =>
  `${s.n > 1 ? s.n + '× ' : ''}${s.item}${s.chance != null ? ` ${Math.round(s.chance * 1000) / 10}%` : ''}`;
const fluid = (f: Fluid) => `${f.mb} mB ${f.item}`;

/** A product name; for combs, hovering (or tapping) it shows what machines turn it into. */
export function CombInfo({ item, children }: { item: string; children: React.ReactNode }) {
  const recipes = combRecipes(combs, item);
  if (!recipes.length) return <>{children}</>;
  return (
    <span className="comb">
      <button className="comb-btn" aria-label={`${item}: what it makes`}>
        {children}
      </button>
      <span className="comb-tip" role="tooltip">
        {recipes.map((r, i) => {
          const extra = [
            ...r.in.filter((s) => s.item !== item || s.n > 1).map(amount),
            ...r.fluidIn.map(fluid),
          ];
          const out = [...r.out.map(amount), ...r.fluidOut.map(fluid)];
          const t = tier(r.eut);
          return (
            <Fragment key={i}>
              <span className="comb-mach">
                <b>{r.machine}</b>
                <span className="sub">
                  {t ? `${t} · ${r.eut.toLocaleString()} EU/t · ` : ''}
                  {seconds(r.ticks)}
                </span>
              </span>
              {extra.length > 0 && <span className="comb-in">with {extra.join(', ')}</span>}
              <span className="comb-out">→ {out.join(', ') || 'nothing'}</span>
            </Fragment>
          );
        })}
      </span>
    </span>
  );
}
