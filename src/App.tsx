import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  Link,
  Navigate,
  Outlet,
  createHashRouter,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
} from 'react-router';
import { Header } from './components/Header';
import { Sidebar, useVisibleRows } from './components/Sidebar';
import { BeeDetail } from './components/BeeDetail';
import { QuestView } from './components/QuestView';
import { searchWords } from './lib/graph';
import { questMatches } from './lib/quests';
import { useHistoryNav } from './hooks/useHistoryNav';
import { DEFAULT_BEE, beePath, legacyTarget, questPath } from './routes';
import { g, ql, useStore } from './store';

/** global keys: Backspace back, / search, Esc clear, Enter open first, arrows move, F/H/N marks */
function useKeys(
  searchRef: RefObject<HTMLInputElement | null>,
  nav: ReturnType<typeof useHistoryNav>,
) {
  const store = useStore();
  const rows = useVisibleRows();
  const navigate = useNavigate();
  const beeMatch = useMatch('/bee/:uid');
  const current = beeMatch?.params.uid && g.byId[beeMatch.params.uid] ? beeMatch.params.uid : null;
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

function Layout() {
  const searchRef = useRef<HTMLInputElement>(null);
  const nav = useHistoryNav();
  useKeys(searchRef, nav);
  return (
    <>
      <Header searchRef={searchRef} nav={nav} />
      <Outlet />
    </>
  );
}

function NotFound() {
  return (
    <div className="notfound">
      Nothing here.{' '}
      <Link className="qlink" to={beePath(DEFAULT_BEE)}>
        Go to the bee list
      </Link>
    </div>
  );
}

/** matches the phone layout in styles.css */
const PHONE = '(max-width: 760px)';

function BeeRoute() {
  const { uid = '' } = useParams();
  const { key } = useLocation();
  const { setLastBee, query } = useStore();
  const ok = !!g.byId[uid];
  // Phones show the list or the detail, not both (desktop ignores this).
  // Every navigation shows the detail; typing a search shows the list.
  const [pane, setPane] = useState({ key, query, list: false });
  const list = pane.key !== key ? false : pane.query !== query ? pane.list || !!query : pane.list;
  if (pane.key !== key || pane.query !== query) setPane({ key, query, list });
  const setList = (v: boolean) => setPane((p) => ({ ...p, list: v }));
  useEffect(() => {
    if (ok) setLastBee(uid);
  }, [ok, uid, setLastBee]);
  // the phone layout scrolls the page: start at the top, or at the picked bee in the list
  useEffect(() => {
    if (!window.matchMedia(PHONE).matches) return;
    const row = list && !query ? document.querySelector('#list .row.sel') : null;
    if (row) row.scrollIntoView({ block: 'center' });
    else window.scrollTo(0, 0);
    // only when the pane or the page changes, not on every search key
  }, [list, key]);
  if (!ok) return <NotFound />;
  return (
    <main id="beesView" className={list ? 'list' : ''}>
      <Sidebar current={uid} onClose={() => setList(false)} />
      <BeeDetail uid={uid} onList={() => setList(true)} />
    </main>
  );
}

function QuestRoute() {
  const { id = '' } = useParams();
  const { setLastQuest } = useStore();
  const ok = !!ql.byId[id];
  useEffect(() => {
    if (ok) setLastQuest(id);
  }, [ok, id, setLastQuest]);
  return ok ? <QuestView id={id} /> : <NotFound />;
}

/** valid import links are applied in main.tsx before the app starts; reaching this route means the link is broken */
function ImportRoute() {
  return (
    <div className="notfound">
      This settings link is broken.{' '}
      <Link className="qlink" to={beePath(DEFAULT_BEE)}>
        Go to the bee list
      </Link>
    </div>
  );
}

/** unknown paths: old single-file links (#b:<uid>, #q:<id>, #<uid>) redirect, the rest is "not found" */
function Fallback() {
  const { pathname } = useLocation();
  const to = legacyTarget(
    pathname,
    (u) => !!g.byId[u],
    (q) => !!ql.byId[q],
  );
  return to ? <Navigate to={to} replace /> : <NotFound />;
}

export const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to={beePath(DEFAULT_BEE)} replace /> },
      { path: 'bee/:uid', element: <BeeRoute /> },
      { path: 'quest/:id', element: <QuestRoute /> },
      { path: 'import', element: <ImportRoute /> },
      { path: '*', element: <Fallback /> },
    ],
  },
]);
