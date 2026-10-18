import { useEffect } from 'react';
import { QuestView } from '../components/QuestView';
import { SITE, pageMeta } from '../meta';
import { useStore } from '../store';

export const meta = () =>
  pageMeta(
    `Be(e) Breeding quests · ${SITE}`,
    'The GTNH Be(e) Breeding quest chapter as a map: pick a quest to see the full path to it, what it needs and what it unlocks.',
  );

export default function Quests() {
  const { setLastQuest } = useStore();
  // the tabs come back here, not to the quest that was cleared
  useEffect(() => setLastQuest(null), [setLastQuest]);
  return <QuestView id={null} />;
}
