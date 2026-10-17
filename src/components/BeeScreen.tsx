import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { BeeDetail } from './BeeDetail';
import { Sidebar } from './Sidebar';
import { useStore } from '../store';

/** matches the phone layout in styles.css */
const PHONE = '(max-width: 760px)';

/** list + bee page (the bee route, and the home page with the default bee) */
export function BeeScreen({ uid }: { uid: string }) {
  const { key } = useLocation();
  const { setLastBee, query } = useStore();
  // Phones show the list or the detail, not both (desktop ignores this).
  // Every navigation shows the detail; typing a search shows the list.
  const [pane, setPane] = useState({ key, query, list: false });
  const list = pane.key !== key ? false : pane.query !== query ? pane.list || !!query : pane.list;
  if (pane.key !== key || pane.query !== query) setPane({ key, query, list });
  const setList = (v: boolean) => setPane((p) => ({ ...p, list: v }));
  useEffect(() => setLastBee(uid), [uid, setLastBee]);
  // the phone layout scrolls the page: start at the top, or at the picked bee in the list
  useEffect(() => {
    if (!window.matchMedia(PHONE).matches) return;
    const row = list && !query ? document.querySelector('#list .row.sel') : null;
    if (row) row.scrollIntoView({ block: 'center' });
    else window.scrollTo(0, 0);
    // only when the pane or the page changes, not on every search key
  }, [list, key]);
  return (
    <main id="beesView" className={list ? 'list' : ''}>
      <Sidebar current={uid} onClose={() => setList(false)} />
      <BeeDetail uid={uid} onList={() => setList(true)} />
    </main>
  );
}
