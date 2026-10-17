import { useEffect, useRef, type RefObject } from 'react';
import { useNavigate } from 'react-router';
import { useVisibleRows } from '../components/Sidebar';
import { searchWords } from '../lib/graph';
import { questMatches } from '../lib/quests';
import { beePath, questPath } from '../links';
import { g, ql, useStore } from '../store';
import type { useHistoryNav } from './useHistoryNav';

/**
 * Global keys: Backspace back, / search, Esc clear, Enter open first, arrows move, F/H/N marks.
 * `current` is the bee on screen (null on other pages).
 */
export function useKeys(
  searchRef: RefObject<HTMLInputElement | null>,
  nav: ReturnType<typeof useHistoryNav>,
  current: string | null,
) {
  const store = useStore();
  const rows = useVisibleRows();
  const navigate = useNavigate();
  const latest = useRef({ store, rows, navigate, nav, current });
  latest.current = { store, rows, navigate, nav, current };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { store: s, rows, navigate, nav, current } = latest.current;
      const q = searchRef.current;
      const target = e.target instanceof Element ? e.target : null;
      // other fields (branch search, view dropdown) keep their normal keys
      if (target && target !== q && target.matches('input, textarea, select')) {
        if (e.key === 'Escape') (target as HTMLElement).blur();
        return;
      }
      const inSearch = target === q;
      const plain = !inSearch && !e.ctrlKey && !e.metaKey && !e.altKey;

      if (e.key === 'Backspace' && (!inSearch || !s.query)) {
        e.preventDefault();
        if (e.shiftKey) nav.forward();
        else nav.back();
      } else if (e.key === 'Escape') {
        s.setQuery('');
        q?.blur();
      } else if (e.key === '/' && !inSearch) {
        e.preventDefault();
        q?.focus();
        q?.select();
      } else if (plain && current && ['f', 'h', 'n'].includes(e.key.toLowerCase())) {
        const k = e.key.toLowerCase();
        if (k === 'f') s.toggleFav(current);
        else if (k === 'h') s.toggleHave(current);
        else s.toggleNope(current);
      } else if (e.key === 'Enter' && inSearch) {
        if (current) {
          if (rows.length) navigate(beePath(rows[0].uid));
        } else {
          const hit = ql.nodes.find((n) => questMatches(n, g, searchWords(s.query)));
          if (hit) navigate(questPath(hit.id));
        }
        q?.blur();
      } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && current && rows.length) {
        e.preventDefault();
        const i = rows.findIndex((r) => r.uid === current);
        const next =
          i < 0 ? 0 : e.key === 'ArrowDown' ? Math.min(rows.length - 1, i + 1) : Math.max(0, i - 1);
        if (rows[next].uid !== current) navigate(beePath(rows[next].uid));
      }
    };
    // mouse side buttons
    const onMouse = (e: MouseEvent) => {
      if (e.button === 3) {
        e.preventDefault();
        latest.current.nav.back();
      } else if (e.button === 4) {
        e.preventDefault();
        latest.current.nav.forward();
      }
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('mouseup', onMouse);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('mouseup', onMouse);
    };
  }, [searchRef]);
}
