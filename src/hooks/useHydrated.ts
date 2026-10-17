import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** false in prerendered HTML and during hydration, true after: for browser-only UI */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
