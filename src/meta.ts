// Page titles and descriptions (search results, link previews)
import type { MetaDescriptor } from 'react-router';
import { MODS, type Species } from './lib/graph';
import type { Quest } from './lib/quests';
import { g } from './store';

export const SITE = 'GTNH Bee Tree';

export function pageMeta(title: string, description: string): MetaDescriptor[] {
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE },
  ];
}

export function beeMeta(s: Species): MetaDescriptor[] {
  const recipes = g.makes[s.uid]
    .map((m) => `${g.byId[m.a].name} + ${g.byId[m.b].name} (${Math.round(m.chance * 100) / 100}%)`)
    .join(', ');
  const how = recipes ? `Breed it from ${recipes}.` : 'It cannot be bred: find it in the world.';
  const makes = [...s.products, ...s.specialty].map((p) => p.item).join(', ');
  return pageMeta(
    `${s.name} bee (${MODS[s.mod] ?? s.mod}) · ${SITE}`,
    `How to get the ${s.name} bee in GregTech: New Horizons. ${how}${makes ? ` Produces ${makes}.` : ''}`,
  );
}

export function questMeta(q: Quest): MetaDescriptor[] {
  return pageMeta(
    `${q.name} · Be(e) Breeding quest · ${SITE}`,
    `The "${q.name}" quest from the GTNH Be(e) Breeding chapter: what it needs, the full quest path to it, and what it unlocks.`,
  );
}
