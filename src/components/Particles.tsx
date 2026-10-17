import { useMemo } from 'react';
import { BeeImg } from './Bee';
import { useHydrated } from '../hooks/useHydrated';
import { useBackgroundBees, useBackgroundBeesTip } from '../hooks/useBackgroundBees';
import { g } from '../store';

const COUNT = 8;

/**
 * A few tiny bees drifting slowly behind the page. Pure decoration: random per visit, so it only
 * renders in the browser (not in prerendered HTML) and ignores the pointer. On by default; the
 * Filters panel has an on/off switch, and a one-time tip says so (useBackgroundBees).
 */
export function Particles() {
  const hydrated = useHydrated();
  const [shown] = useBackgroundBees();
  const bees = useMemo(
    () =>
      hydrated
        ? Array.from({ length: COUNT }, (_, i) => ({
            s: g.species[Math.floor(Math.random() * g.species.length)],
            top: 5 + Math.random() * 85, // vh
            size: 14 + Math.random() * 10, // px
            duration: 28 + Math.random() * 30, // s to cross the screen
            delay: -Math.random() * 60, // start mid-flight
            bob: 2.5 + Math.random() * 3, // s per up/down wave
            reverse: i % 2 === 1,
          }))
        : [],
    [hydrated],
  );
  if (!shown) return null;
  return (
    <div className="particles" aria-hidden>
      {bees.map((b, i) => (
        <span
          key={i}
          className={'particle' + (b.reverse ? ' rev' : '')}
          style={{
            top: `${b.top}vh`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <span style={{ width: b.size, height: b.size, animationDuration: `${b.bob}s` }}>
            <BeeImg s={b.s} />
          </span>
        </span>
      ))}
    </div>
  );
}

/** first-visit note: the bees are decoration and can be turned off */
export function ParticlesTip() {
  const [shown, toggle] = useBackgroundBees();
  const [open, dismiss] = useBackgroundBeesTip();
  if (!open || !shown) return null;
  return (
    <div className="tip" role="status">
      <span>🐝 Little bees fly in the background. Turn them off any time in Filters.</span>
      <button className="btn" onClick={toggle}>
        Turn off
      </button>
      <button className="tip-x" aria-label="Close" onClick={dismiss}>
        ×
      </button>
    </div>
  );
}
