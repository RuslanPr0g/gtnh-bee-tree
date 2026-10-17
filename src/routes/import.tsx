import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { NotFound } from '../components/NotFound';
import { decodeSettings, writeSettings } from '../lib/settings';
import { SITE, pageMeta } from '../meta';
import { useStore } from '../store';

export const meta = () => [
  ...pageMeta(`Import settings · ${SITE}`, 'Bring your saved bees to this browser.'),
  { name: 'robots', content: 'noindex' },
];

/** /import?d=…: saves the settings from a "Copy settings link" here, then opens the bee list */
export default function Import() {
  const [params] = useSearchParams();
  const { reload } = useStore();
  const navigate = useNavigate();
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    const settings = decodeSettings(params.get('d') ?? '');
    if (!settings) return setBroken(true);
    writeSettings(settings);
    reload();
    navigate('/', { replace: true });
  }, [params, reload, navigate]);
  return broken ? (
    <NotFound>This settings link is broken.</NotFound>
  ) : (
    <div className="notfound">Importing your settings…</div>
  );
}
