// Imported first in main.tsx: ES modules run in import order, so the import link is applied
// before the router (created when App.tsx loads) reads the URL and before the store loads settings.
import { consumeImportLink } from './lib/settings';

consumeImportLink();
