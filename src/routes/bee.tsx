import { BeeScreen } from '../components/BeeScreen';
import { NotFound } from '../components/NotFound';
import { SITE, beeMeta, pageMeta } from '../meta';
import { g } from '../store';
import type { Route } from './+types/bee';

const find = (p: Route.MetaArgs['params']) => g.bySlug[`${p.mod}/${p.name}`];

export const meta = ({ params }: Route.MetaArgs) => {
  const s = find(params);
  return s ? beeMeta(s) : pageMeta(`Bee not found · ${SITE}`, 'No bee here.');
};

export default function Bee({ params }: Route.ComponentProps) {
  const s = find(params);
  return s ? <BeeScreen uid={s.uid} /> : <NotFound>No such bee.</NotFound>;
}
