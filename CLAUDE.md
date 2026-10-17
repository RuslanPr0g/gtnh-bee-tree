# GTNH Bee Tree

React 19 + React Router 8 (framework mode, prerendered) + TypeScript + Vite: a bee breeding browser for the Minecraft modpack GregTech: New Horizons. Static site, deployed to GitHub Pages.

## Commands

- `npm run dev`: dev server
- `npm test`: Vitest unit tests (`src/**/*.test.ts`)
- `npm run typecheck`: `tsc --noEmit` (strict, no unused locals/params)
- `npm run build`: icons + route typegen + type-check + prerendered build into `build/pages/`
- `npm run format` / `npm run format:check`: Prettier (single quotes, width 100), JSON data included

Run `npm run format`, `npm test` and `npm run build` before committing; CI (`.github/workflows/ci.yml`, on PRs) checks all three, and `deploy.yml` tests, builds and publishes to GitHub Pages on every push to `main`. Node version: `.nvmrc`.

## Layout

React Router 8 **framework mode** with `ssr: false` and full prerendering (`react-router.config.ts`): every page (home, 450 bees, 169 quests, import) is rendered to its own HTML file at build time, so clean URLs work on GitHub Pages. `buildEnd` turns the output into `build/pages/` (the folder that's deployed) with the SPA fallback as `404.html`.

- `src/data/*.json`: **all data**, plain JSON. Keep it JSON (no data in code). `src/data/index.ts` loads it once into `graph` and `questLine`.
- `src/lib/graph.ts`: pure logic. Species/mutation graph with slugs (`bySlug`), `ancestors`, `computeUnwanted`, `unmarkNope`, `canBreed`, search. No DOM, so it is unit tested.
- `src/lib/quests.ts`: questline model, map layout, `questPath` (prerequisites in order).
- `src/lib/paths.ts`: the URL scheme (`/bee/<mod>/<name>`, `/quest/<name>`), `allPaths` (the prerender list) and `legacyTarget` (old `#/…` and `#b:…` links). `src/links.ts` binds it to the dataset.
- `src/lib/settings.ts`: the settings link (`/import?d=<base64url>`) for moving marks between browsers.
- `src/lib/storage.ts`: localStorage helpers that never throw. Keys are in `KEYS`.
- `tools/build-icons.mjs` → `src/assets/generated/bees.png` (gitignored): every bee icon tinted at build time into one sprite. It runs before dev, build and test. `BeeImg` shows one row of it.
- `src/root.tsx` (document, providers, error boundary), `src/routes.ts` (route config), `src/routes/*.tsx` (route modules with `meta` for titles and descriptions; `shell.tsx` is the layout with header, keys and old-link redirect).
- `src/store.tsx`: React context with the user's marks (have / nope / fav), filters and search query, persisted to localStorage. **Prerender-safe:** state starts empty to match the HTML, then saved values load in a layout effect after hydration, and saving only starts after that.
- `src/components/Particles.tsx` + `src/hooks/useBackgroundBees.ts`: the drifting background bees, with an on/off switch in the Filters panel. On by default for everyone; a one-time tip (`ParticlesTip`) says they can be turned off. Choice and tip are saved in localStorage.
- `src/hooks/`: `useKeys` (keyboard), `useHistoryNav` (back/forward buttons, using `history.state.idx`), `useHydrated` (browser-only UI: the bee list isn't prerendered, so each page stays small), `useMedia` (`PHONE` query; false until hydrated), `usePane` (phone list/detail pane, provided by the shell; links with `LIST_STATE` open the list).
- `src/components/`: `Header`, `Sidebar` (filters + list, and the phone filter sheet), `BeeScreen` (list + detail), `BeeDetail`, `RecipeTree`, `QuestView` (phone: Map / Both / Details split), `BottomNav` (phone tab bar: Bees list · bee · Quests · Search), `NotFound`, and shared `Bee` (BeeImg, Chip link).
- `src/styles.css`: one stylesheet, dark theme, with a phone layout under 760px (sticky search header, bottom tab bar, safe-area insets). Phone-only elements are `display: none` and phone-only wrappers (`.acts`, `.pair`, `.res`, …) are `display: contents` outside it, so the desktop layout doesn't change.
- `tools/`: scripts that regenerate the JSON (see `tools/README.md`).

**Prerendering rule:** code that runs during render must not touch `window`, `document` or `localStorage`. Use effects, `useHydrated`, or `typeof window` guards.

## Rules that matter (keep the tests in sync)

- **Not wanted**:
  - The roots are the bees the user marked.
  - A bee also becomes unwanted when **every** recipe that makes it has a parent that is unwanted. Repeat until nothing changes.
  - The ancestors of any root are never marked, and neither are owned bees.
  - `unwanted` maps each bee to the set of roots that cause it.
  - Unchecking a bee removes all of its causes (`unmarkNope`), so the bee always ends up wanted.
- **I have this** and **not wanted** exclude each other. Owning a bee removes its own not-wanted mark and disables the button.
- **Can breed now**: the bee is not owned, not unwanted, and some recipe has both parents owned.
- **URLs:** bee and quest slugs come from the names, and `buildGraph` / `buildQuestLine` throw if two would collide.
- **Navigation is links.** Bees, list rows, quest nodes and tabs are `<Link>`s, so middle-click and new tabs work. Actions (marks, filters) are buttons.
- **Keys** are handled in `useKeys` (`App.tsx`):
  - Backspace and Shift+Backspace go back and forward, except while typing in a non-empty search box.
  - `/` focuses search, Esc clears it, and Enter opens the first result.
  - The arrow keys move through the list, and F / H / N toggle the marks.
  - Other inputs keep their normal keys.

## Conventions

- Match the existing style: small function components, comments only where the reason isn't obvious.
- Prefer pure functions in `src/lib` with tests over logic inside components.
- Keep the dataset in the bundle. The build warning limit is raised on purpose (`vite.config.ts`).
