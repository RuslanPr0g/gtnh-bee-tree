import { useEffect, useRef, type RefObject } from 'react';

const MIN = 60; // px sideways
const EDGE = 24; // px: the browser's own back / forward swipe starts at the screen edges
const MAX_MS = 700;

/** something under the finger that scrolls sideways itself (a wide recipe tree) */
function scrollsSideways(el: Element | null, stop: Element) {
  for (; el && el !== stop; el = el.parentElement) {
    const x = getComputedStyle(el).overflowX;
    if ((x === 'auto' || x === 'scroll') && el.scrollWidth > el.clientWidth) return true;
  }
  return false;
}

/** calls onSwipe(1) for a swipe to the left (next) and onSwipe(-1) for one to the right */
export function useSwipe(ref: RefObject<HTMLElement | null>, onSwipe: (by: 1 | -1) => void) {
  const latest = useRef(onSwipe);
  latest.current = onSwipe;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number; t: number } | null = null;
    const down = (e: TouchEvent) => {
      const p = e.touches[0];
      const target = e.target instanceof Element ? e.target : null;
      start =
        e.touches.length === 1 &&
        p.clientX > EDGE &&
        p.clientX < window.innerWidth - EDGE &&
        !target?.closest('input, textarea, select, .bname-tip') &&
        !scrollsSideways(target, el)
          ? { x: p.clientX, y: p.clientY, t: e.timeStamp }
          : null;
    };
    const up = (e: TouchEvent) => {
      if (!start) return;
      const p = e.changedTouches[0];
      const dx = p.clientX - start.x;
      const dy = p.clientY - start.y;
      const quick = e.timeStamp - start.t < MAX_MS;
      start = null;
      // mostly sideways, so scrolling the page up and down never counts
      if (quick && Math.abs(dx) > MIN && Math.abs(dx) > 2 * Math.abs(dy))
        latest.current(dx < 0 ? 1 : -1);
    };
    const cancel = () => (start = null);
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchend', up, { passive: true });
    el.addEventListener('touchcancel', cancel, { passive: true });
    return () => {
      el.removeEventListener('touchstart', down);
      el.removeEventListener('touchend', up);
      el.removeEventListener('touchcancel', cancel);
    };
  }, [ref]);
}
