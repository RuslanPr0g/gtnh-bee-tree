import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { useStore } from '../store';

/** link state that opens a bee page on the list pane (the phone "Bees" tab) */
export const LIST_STATE = { list: true };

const wantsList = (state: unknown) =>
  typeof state === 'object' && state !== null && (state as { list?: unknown }).list === true;

// Phones show the bee list or the bee detail, not both (desktop ignores this).
// Every navigation shows the detail, unless its link asks for the list (LIST_STATE);
// typing a search shows the list. The first render always shows the detail, like the prerendered
// HTML, even when a reload brings back LIST_STATE.
function usePaneState() {
  const { key, state } = useLocation();
  const { query } = useStore();
  const [pane, setPane] = useState({ key, query, list: false });
  const list =
    pane.key !== key ? wantsList(state) : pane.query !== query ? pane.list || !!query : pane.list;
  if (pane.key !== key || pane.query !== query) setPane({ key, query, list });
  const setList = useCallback((v: boolean) => setPane((p) => ({ ...p, list: v })), []);
  return { list, setList };
}

const PaneContext = createContext<ReturnType<typeof usePaneState> | null>(null);

export function PaneProvider({ children }: { children: ReactNode }) {
  return <PaneContext.Provider value={usePaneState()}>{children}</PaneContext.Provider>;
}

export function usePane() {
  const p = useContext(PaneContext);
  if (!p) throw new Error('usePane outside PaneProvider');
  return p;
}
