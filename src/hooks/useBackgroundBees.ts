import { useSyncExternalStore } from 'react';
import { KEYS, load, save } from '../lib/storage';
import { useMedia } from './useMedia';

// The user's choice ('on' | 'off'), or null to follow the system: off when it asks for less motion.
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const read = () => {
  const v = load<unknown>(KEYS.particles, null);
  return v === 'on' || v === 'off' ? v : null;
};

/** [shown, toggle] for the drifting background bees */
export function useBackgroundBees(): [boolean, () => void] {
  const choice = useSyncExternalStore(subscribe, read, () => null);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const shown = choice ? choice === 'on' : !reduced;
  const toggle = () => {
    save(KEYS.particles, shown ? 'off' : 'on');
    listeners.forEach((fn) => fn());
  };
  return [shown, toggle];
}
