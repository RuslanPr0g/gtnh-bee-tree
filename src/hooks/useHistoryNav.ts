import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router';

// React Router stores the entry's position in history.state.idx. We remember the furthest position
// reached in this tab (sessionStorage, so it survives reloads) to know whether "forward" is possible.
const MAX_KEY = 'gtnhBeesMaxIdx';
const readIdx = (): number => (typeof window.history.state?.idx === 'number' ? window.history.state.idx : 0);
const readMax = (): number => {
  try {
    return Number(sessionStorage.getItem(MAX_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeMax = (n: number) => {
  try {
    sessionStorage.setItem(MAX_KEY, String(n));
  } catch {
    // ignore
  }
};

export function useHistoryNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const type = useNavigationType();
  const [state, setState] = useState(() => ({ idx: readIdx(), max: Math.max(readIdx(), readMax()) }));

  useEffect(() => {
    const idx = readIdx();
    setState((s) => {
      // a new push cuts off the forward entries; back/forward keeps them
      const max = type === 'PUSH' ? idx : Math.max(s.max, idx);
      writeMax(max);
      return { idx, max };
    });
  }, [location.key, type]);

  return {
    canBack: state.idx > 0,
    canForward: state.idx < state.max,
    back: () => state.idx > 0 && navigate(-1),
    forward: () => state.idx < state.max && navigate(1),
  };
}
