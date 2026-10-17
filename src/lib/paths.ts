// Clean URLs (every page is prerendered to HTML at build time, so they work on GitHub Pages):
//   /bee/<mod>/<name>   e.g. /bee/magic-bees/abandoned
//   /quest/<name>       e.g. /quest/naquadah
//   /import?d=…         settings link (see settings.ts)
// Paths here are relative to the app basename (/gtnh-bee-tree/ on GitHub Pages).
import type { Graph } from './graph';
import type { QuestLine } from './quests';

export const DEFAULT_BEE = 'forestry.speciesMonastic';

export const beePath = (g: Graph, uid: string) => `/bee/${g.byId[uid]?.slug ?? ''}`;
export const questPath = (ql: QuestLine, id: string) => `/quest/${ql.byId[id]?.slug ?? ''}`;

/** every page to prerender */
export const allPaths = (g: Graph, ql: QuestLine) => [
  '/',
  ...g.species.map((s) => beePath(g, s.uid)),
  ...ql.nodes.map((n) => questPath(ql, n.id)),
];

/**
 * Old hash links: #/bee/<uid>, #/quest/<id>, #/import?d=… (hash router version) and
 * #b:<uid>, #q:<id>, #<uid> (single-file page). Returns the new path, or null.
 */
export function legacyTarget(hash: string, g: Graph, ql: QuestLine): string | null {
  let s = hash.replace(/^#\/?/, '');
  if (!s) return null;
  if (s.startsWith('import?')) return `/${s}`;
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  const bee = /^(?:bee\/|b:)(.+)$/.exec(s)?.[1] ?? s;
  if (g.byId[bee]) return beePath(g, bee);
  const quest = /^(?:quest\/|q:)(.+)$/.exec(s)?.[1];
  if (quest && ql.byId[quest]) return questPath(ql, quest);
  return null;
}
