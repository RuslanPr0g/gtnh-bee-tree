import type { Config } from '@react-router/dev/config';
import { cp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { graph, questLine } from './src/data';
import { allPaths } from './src/lib/paths';

const BASENAME = '/gtnh-bee-tree/';

// Static site: no server rendering at request time. Every page (home, 450 bees, 169 quests, import)
// is prerendered to its own HTML file at build time, so clean URLs work on GitHub Pages.
export default {
  appDirectory: 'src',
  ssr: false,
  basename: BASENAME,
  prerender: { paths: [...allPaths(graph, questLine), '/import'], concurrency: 8 },
  // React Router writes pages under build/client/<basename>/ and assets under build/client/assets/.
  // GitHub Pages serves the artifact AT the basename, so build/pages is that folder, flattened.
  // The SPA fallback (shell without content) becomes 404.html: GitHub Pages serves it for unknown
  // paths and the router then shows the not-found page.
  async buildEnd({ reactRouterConfig }) {
    const client = join(reactRouterConfig.buildDirectory, 'client');
    const out = join(reactRouterConfig.buildDirectory, 'pages');
    const exists = (p: string) =>
      stat(p).then(
        () => true,
        () => false,
      );
    const fallback = (await exists(join(client, '__spa-fallback.html')))
      ? join(client, '__spa-fallback.html')
      : join(client, 'index.html');
    await rm(out, { recursive: true, force: true });
    await cp(join(client, BASENAME), out, { recursive: true });
    await cp(join(client, 'assets'), join(out, 'assets'), { recursive: true });
    await cp(fallback, join(out, '404.html'));
  },
} satisfies Config;
