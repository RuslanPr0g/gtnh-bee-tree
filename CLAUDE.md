# GTNH Bee Tree

React 19 + TypeScript + Vite single-page app: a bee breeding browser for the Minecraft modpack GregTech: New Horizons. Static site, deployed to GitHub Pages.

## Commands

- `npm run dev`: dev server
- `npm test`: Vitest unit tests (`src/**/*.test.ts`)
- `npm run typecheck`: `tsc --noEmit` (strict, no unused locals/params)
- `npm run build`: type-check + production build into `dist/`
- `npm run format` / `npm run format:check`: Prettier (single quotes, width 100), JSON data included

Run `npm run format`, `npm test` and `npm run build` before committing; CI (`.github/workflows/ci.yml`, on PRs) checks all three, and `deploy.yml` tests, builds and publishes to GitHub Pages on every push to `main`. Node version: `.nvmrc`.

## Layout

- `src/data/*.json`: **all data**, plain JSON. Keep it JSON (no data in code). `src/data/index.ts` loads it once into `graph` and `questLine`.
- `src/lib/graph.ts`: pure logic. Species/mutation graph, `ancestors`, `computeUnwanted`, `unmarkNope`, `canBreed`, search. No DOM, so it is unit tested.
- `src/lib/quests.ts`: questline model, map layout, `questPath` (prerequisites in order).
- `src/lib/icons.ts`: draws bee icons on a canvas from Forestry's 3 texture layers, tinted with the species' two colors. The app renders only after `iconsReady` resolves.
- `src/lib/storage.ts`: localStorage helpers that never throw. Keys are in `KEYS`.
- `src/store.tsx`: React context with the user's marks (have / nope / fav), filters and search query. All are persisted.
- `src/routes.ts` + `src/App.tsx`: hash router (`createHashRouter`). Routes are `/bee/:uid` and `/quest/:id`. `Fallback` redirects old single-file links (`#b:<uid>`, `#q:<id>`, `#<uid>`).
- `src/hooks/useHistoryNav.ts`: back/forward buttons, using React Router's `history.state.idx`.
- `src/components/`: `Header`, `Sidebar` (filters + list), `BeeDetail`, `RecipeTree`, `QuestView`, and shared `Bee` (BeeImg, Chip link).
- `src/styles.css`: one stylesheet, dark theme, with a phone layout under 760px.
- `tools/`: scripts that regenerate the JSON (see `tools/README.md`).

## Rules that matter (keep the tests in sync)

- **Not wanted**:
  - The roots are the bees the user marked.
  - A bee also becomes unwanted when **every** recipe that makes it has a parent that is unwanted. Repeat until nothing changes.
  - The ancestors of any root are never marked, and neither are owned bees.
  - `unwanted` maps each bee to the set of roots that cause it.
  - Unchecking a bee removes all of its causes (`unmarkNope`), so the bee always ends up wanted.
- **I have this** and **not wanted** exclude each other. Owning a bee removes its own not-wanted mark and disables the button.
- **Can breed now**: the bee is not owned, not unwanted, and some recipe has both parents owned.
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
