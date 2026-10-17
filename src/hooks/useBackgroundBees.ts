import { useSyncExternalStore } from 'react';
import { KEYS, load, save } from '../lib/storage';

// The background bees are on unless the user turned them off ('on' | 'off' once they chose).
// A one-time tip tells new visitors they can be turned off.
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const notify = () => listeners.forEach((fn) => fn());
const read = () => load<unknown>(KEYS.particles, null) !== 'off';
const tipSeen = () => load<unknown>(KEYS.particlesTip, false) === true;

/** [shown, toggle] for the drifting background bees */
export function useBackgroundBees(): [boolean, () => void] {
  // false in prerendered HTML: the bees are browser-only decoration
  const shown = useSyncExternalStore(subscribe, read, () => false);
  const toggle = () => {
    save(KEYS.particles, shown ? 'off' : 'on');
    save(KEYS.particlesTip, true);
    notify();
  };
  return [shown, toggle];
}

/** whether to show the first-visit tip, and a function to dismiss it for good */
export function useBackgroundBeesTip(): [boolean, () => void] {
  const seen = useSyncExternalStore(subscribe, tipSeen, () => true);
  const dismiss = () => {
    save(KEYS.particlesTip, true);
    notify();
  };
  return [!seen, dismiss];
}
