import { useMemo } from 'react';
import { BeeImg } from './Bee';
import { useHydrated } from '../hooks/useHydrated';
import { g } from '../store';

const COUNT = 7;

/**
 * A few tiny bees drifting slowly behind the page. Pure decoration: random per visit, so it only
 * renders in the browser (not in prerendered HTML), ignores the pointer, and stops for
 * prefers-reduced-motion (styles.css).
 */
export function Particles() {
  const hydrated = useHydrated();
  const bees = useMemo(
    () =>
      hydrated
        ? Array.from({ length: COUNT }, (_, i) => ({
            s: g.species[Math.floor(Math.random() * g.species.length)],
            top: 5 + Math.random() * 85, // vh
            size: 10 + Math.random() * 8, // px
            duration: 45 + Math.random() * 50, // s to cross the screen
            delay: -Math.random() * 90, // start mid-flight
            bob: 4 + Math.random() * 4, // s per up/down wave
            reverse: i % 2 === 1,
          }))
        : [],
    [hydrated],
  );
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
