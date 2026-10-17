import { NotFound } from '../components/NotFound';
import { SITE, pageMeta } from '../meta';

export const meta = () => [
  ...pageMeta(`Not found · ${SITE}`, 'This page does not exist.'),
  { name: 'robots', content: 'noindex' },
];

export default function NotFoundRoute() {
  return <NotFound />;
}
