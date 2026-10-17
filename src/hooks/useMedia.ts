import { useSyncExternalStore } from 'react';

/** matches the phone layout in styles.css */
export const PHONE = '(max-width: 760px)';

/** whether a media query matches; false in prerendered HTML and during hydration */
export const useMedia = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', onChange);
      return () => m.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
