import type { RefObject } from 'react';
import { Link, useMatch } from 'react-router';
import { g, ql, useStore } from '../store';
import { firstQuest } from '../lib/quests';
import { DEFAULT_BEE, beePath, questPath } from '../routes';
import type { useHistoryNav } from '../hooks/useHistoryNav';

const RECIPES = g.species.reduce((n, s) => n + g.makes[s.uid].length, 0);

interface Props {
  searchRef: RefObject<HTMLInputElement | null>;
  nav: ReturnType<typeof useHistoryNav>;
}

export function Header({ searchRef, nav }: Props) {
  const { lastBee, lastQuest, query, setQuery } = useStore();
  const onQuests = !!useMatch('/quest/*');
  return (
    <header>
      <div className="nav">
        <button onClick={nav.back} disabled={!nav.canBack} title="Back (Backspace)">
          ←
        </button>
        <button onClick={nav.forward} disabled={!nav.canForward} title="Forward (Shift+Backspace)">
          →
        </button>
      </div>
      <h1>
        🐝 GTNH Bee Tree
        <span>
          {g.species.length} bees · {RECIPES} recipes
        </span>
      </h1>
      <nav className="tabs">
        <Link className={onQuests ? '' : 'on'} to={beePath(lastBee ?? DEFAULT_BEE)}>
          Bees
        </Link>
        <Link className={onQuests ? 'on' : ''} to={questPath(lastQuest ?? firstQuest(ql))}>
          📖 Quest path
        </Link>
      </nav>
      <input
        id="q"
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search bees, branches, products… (e.g. monastic, naquadah, comb)"
        autoFocus
      />
    </header>
  );
}
