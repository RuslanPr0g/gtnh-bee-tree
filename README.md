# GTNH Bee Tree

A fast, searchable bee breeding browser for **GregTech: New Horizons** (GTNH 2.8.1).

- All 450 bee species and 538 breeding recipes, read straight from the game
- "How to get it" breeding tree and "breeds into" list for every bee
- The **Be(e) Breeding** quest book chapter as a map, with the full quest path to any quest
- Track bees: ★ bookmark, ✓ I have this, ✗ not wanted (also hides bees that can only be bred from it)
- Filters by mod, branch and view (can breed now, base bees, …)
- Every bee and quest has its own URL: middle-click to open in a new tab, bookmark, share

## Run it

```bash
npm install
npm run dev        # http://localhost:5173/gtnh-bee-tree/
npm test           # unit tests (rules for not-wanted, can-breed, search, routes)
npm run build      # prerendered static site in build/pages/
npm run preview    # serve that build at http://localhost:4173/gtnh-bee-tree/
npm run format     # Prettier (CI checks it)
```

## URLs

Every page has a clean URL and is prerendered to static HTML, so links open directly, show up in search with their own titles, and preview nicely when shared:

| Page  | URL                                  |
| ----- | ------------------------------------ |
| Bee   | `/gtnh-bee-tree/bee/forestry/heroic` |
| Quest | `/gtnh-bee-tree/quest/naquadah`      |

Old `#/bee/…` links still work and redirect to these.

## Data

All data is plain JSON in `src/data/` and can be edited by hand or regenerated:

| File          | What                                                          | How it's made                                          |
| ------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| `bees.json`   | species (name, branch, climate, products, colors) + mutations | `tools/beedump-agent` (reads a running GTNH client)    |
| `quests.json` | the Be(e) Breeding questline (layout, prerequisites, bees)    | `tools/extract-quests.py` (reads the quest book files) |

See [`tools/README.md`](tools/README.md) for the steps.

## Deploy

- `.github/workflows/ci.yml`: on pull requests, checks formatting, runs tests and builds.
- `.github/workflows/deploy.yml`: on every push to `main`, tests, builds and publishes to GitHub Pages.

Live at https://ruslanpr0g.github.io/gtnh-bee-tree/
