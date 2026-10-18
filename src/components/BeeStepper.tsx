import { Link } from 'react-router';
import { stepIn } from '../lib/graph';
import { beePath } from '../links';
import { g, VIEWS, useStore } from '../store';
import { useVisibleRows } from './Sidebar';

/** link state: which way the bee page was stepped, for the slide-in */
export const stepState = (by: 1 | -1) => ({ step: by });

/** the bees before and after this one in the list as it's filtered now */
export function useStep(uid: string) {
  const rows = useVisibleRows().map((r) => r.uid);
  return {
    pos: rows.indexOf(uid),
    total: rows.length,
    // a bee outside the list only steps forward, to the first one
    prev: rows.includes(uid) ? stepIn(rows, uid, -1) : null,
    next: stepIn(rows, uid, 1),
  };
}

/** phone only: previous / next bee in the list (swiping does the same) */
export function BeeStepper({ uid }: { uid: string }) {
  const { filters } = useStore();
  const { pos, total, prev, next } = useStep(uid);
  const side = (to: string | null, by: 1 | -1) =>
    to ? (
      <Link className="btn" to={beePath(to)} state={stepState(by)}>
        {by < 0 && '‹ '}
        <span className="nm">{g.byId[to].name}</span>
        {by > 0 && ' ›'}
      </Link>
    ) : (
      <span />
    );
  return (
    <nav className="stepper" aria-label="Previous and next bee">
      {side(prev, -1)}
      <span className="pos" title="Swipe left or right to step through the list">
        {pos < 0 ? '–' : pos + 1} / {total}
        <span className="view">{VIEWS[filters.view]}</span>
      </span>
      {side(next, 1)}
    </nav>
  );
}
