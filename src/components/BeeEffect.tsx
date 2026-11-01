import { effectFor } from '../data';
import { LEVEL_LABEL, isRisky } from '../lib/effects';

/** small ⚠ after a bee name (list rows, chips) when its effect is risky */
export function EffectMark({ uid }: { uid: string }) {
  const e = effectFor(uid);
  if (!isRisky(e)) return null;
  return (
    <span className={'fxmark ' + e!.level} title={`${e!.name}: ${e!.text}`}>
      {' '}
      ⚠
    </span>
  );
}

/** the bee's effect near its hive; risky ones get a loud warning box */
export function EffectBanner({ uid }: { uid: string }) {
  const e = effectFor(uid);
  if (!e) return null;
  return (
    <div className={'fx ' + e.level} role={isRisky(e) ? 'alert' : undefined}>
      <div className="fxhead">
        {isRisky(e) && <span aria-hidden>⚠ </span>}
        <b>{LEVEL_LABEL[e.level]}</b> · Effect: <b>{e.name}</b>
      </div>
      <div>{e.text}</div>
      {e.suit && (
        <div className="fxsub">A full Apiarist's suit (all 4 pieces) protects you from it.</div>
      )}
      {isRisky(e) && (
        <div className="fxsub">
          It works in the bee's territory around the hive. Keep it away from your base, or breed the
          effect out.
        </div>
      )}
    </div>
  );
}
