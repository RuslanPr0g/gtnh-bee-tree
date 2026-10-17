import { useEffect } from 'react';
import { NotFound } from '../components/NotFound';
import { QuestView } from '../components/QuestView';
import { SITE, pageMeta, questMeta } from '../meta';
import { ql, useStore } from '../store';
import type { Route } from './+types/quest';

export const meta = ({ params }: Route.MetaArgs) => {
  const q = ql.bySlug[params.name];
  return q ? questMeta(q) : pageMeta(`Quest not found · ${SITE}`, 'No quest here.');
};

export default function Quest({ params }: Route.ComponentProps) {
  const q = ql.bySlug[params.name];
  const { setLastQuest } = useStore();
  useEffect(() => {
    if (q) setLastQuest(q.id);
  }, [q, setLastQuest]);
  return q ? <QuestView id={q.id} /> : <NotFound>No such quest.</NotFound>;
}
