import { BeeScreen } from '../components/BeeScreen';
import { DEFAULT_BEE } from '../links';
import { SITE, pageMeta } from '../meta';

export const meta = () =>
  pageMeta(
    `${SITE}: bee breeding for GregTech: New Horizons`,
    'Every GTNH bee and breeding recipe with search, breeding trees, the Be(e) Breeding quest path, and tracking for the bees you have.',
  );

export default function Home() {
  return <BeeScreen uid={DEFAULT_BEE} />;
}
