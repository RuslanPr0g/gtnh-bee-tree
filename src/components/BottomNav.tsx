import type { RefObject } from 'react';
import { Link, useMatch } from 'react-router';
import { BeeImg } from './Bee';
import { g, useStore } from '../store';
import { DEFAULT_BEE, QUESTS, beePath, questPath } from '../links';
import { LIST_STATE, usePane } from '../hooks/usePane';

/** 24px line icons that take the tab's text colour */
const Icon = ({ d }: { d: string }) => (
  <svg className="ico" viewBox="0 0 24 24" aria-hidden>
    <path d={d} />
  </svg>
);
const LIST = 'M4 6h16M4 12h16M4 18h16';
const BOOK = 'M5 6a2 2 0 0 1 2-2h12v13H7a2 2 0 0 0-2 2zM5 19a2 2 0 0 0 2 2h12v-4';
const SEARCH = 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5 21 21';

interface Props {
  /** bee on screen (null on other pages) */
  current: string | null;
  searchRef: RefObject<HTMLInputElement | null>;
}

/** phone tab bar at the bottom of the screen (hidden on desktop) */
export function BottomNav({ current, searchRef }: Props) {
  const { lastBee, lastQuest } = useStore();
  const { list, setList } = usePane();
  const onQuests = !!useMatch('/quest/*');
  const bee = current ?? lastBee ?? DEFAULT_BEE;
  const tab = current ? (list ? 'list' : 'bee') : onQuests ? 'quest' : null;
  const on = (t: string) => (tab === t ? { className: 'on', 'aria-current': 'page' as const } : {});
  return (
    <nav id="bnav" aria-label="Sections">
      <Link to={beePath(bee)} state={LIST_STATE} {...on('list')}>
        <Icon d={LIST} />
        <span className="lbl">Bees</span>
      </Link>
      <Link to={beePath(bee)} {...on('bee')}>
        <BeeImg s={g.byId[bee]} />
        <span className="lbl">{g.byId[bee].name}</span>
      </Link>
      <Link to={lastQuest ? questPath(lastQuest) : QUESTS} {...on('quest')}>
        <Icon d={BOOK} />
        <span className="lbl">Quests</span>
      </Link>
      <button
        onClick={() => {
          if (current) setList(true);
          searchRef.current?.focus();
        }}
      >
        <Icon d={SEARCH} />
        <span className="lbl">Search</span>
      </button>
    </nav>
  );
}
