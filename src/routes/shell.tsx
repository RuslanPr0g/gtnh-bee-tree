import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router';
import { BottomNav } from '../components/BottomNav';
import { Header } from '../components/Header';
import { Particles } from '../components/Particles';
import { useHistoryNav } from '../hooks/useHistoryNav';
import { useKeys } from '../hooks/useKeys';
import { PaneProvider } from '../hooks/usePane';
import { legacyTarget } from '../lib/paths';
import { DEFAULT_BEE } from '../links';
import { g, ql } from '../store';

/** bee shown on screen: the bee page, or the default bee on the home page */
function useCurrentBee(): string | null {
  const bee = useMatch('/bee/:mod/:name');
  const home = useMatch('/');
  if (bee) return g.bySlug[`${bee.params.mod}/${bee.params.name}`]?.uid ?? null;
  return home ? DEFAULT_BEE : null;
}

export default function Shell() {
  const searchRef = useRef<HTMLInputElement>(null);
  const nav = useHistoryNav();
  const current = useCurrentBee();
  useKeys(searchRef, nav, current);

  // links from the hash-router versions (#/bee/<uid>, #b:<uid>, …) still work
  const { hash } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const to = legacyTarget(hash, g, ql);
    if (to) navigate(to, { replace: true });
  }, [hash, navigate]);

  return (
    <PaneProvider>
      <Particles />
      <Header searchRef={searchRef} nav={nav} />
      <Outlet />
      <BottomNav current={current} searchRef={searchRef} />
    </PaneProvider>
  );
}
