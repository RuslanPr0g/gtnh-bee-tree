// URL scheme (hash routing, so it works on GitHub Pages without server rewrites):
//   #/bee/<species uid>     e.g. #/bee/forestry.speciesHeroic
//   #/quest/<quest id>      e.g. #/quest/0%3A358
export const DEFAULT_BEE = 'forestry.speciesMonastic';

export const beePath = (uid: string) => `/bee/${encodeURIComponent(uid)}`;
export const questPath = (id: string) => `/quest/${encodeURIComponent(id)}`;

/** links from the old single-file page looked like #b:<uid>, #q:<id> or #<uid> */
export function legacyTarget(
  raw: string,
  isBee: (u: string) => boolean,
  isQuest: (q: string) => boolean,
): string | null {
  let s = raw.replace(/^\//, '');
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (s.startsWith('b:') && isBee(s.slice(2))) return beePath(s.slice(2));
  if (s.startsWith('q:') && isQuest(s.slice(2))) return questPath(s.slice(2));
  if (isBee(s)) return beePath(s);
  return null;
}
