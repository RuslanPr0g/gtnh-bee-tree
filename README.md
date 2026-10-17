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
npm run dev        # http://localhost:5173
npm test           # unit tests (rules for not-wanted, can-breed, search, routes)
npm run build      # static site in dist/
npm run format     # Prettier (CI checks it)
```

## URLs

Hash routing, so it works on GitHub Pages with no server setup:

| Page  | URL                            |
| ----- | ------------------------------ |
| Bee   | `#/bee/forestry.speciesHeroic` |
| Quest | `#/quest/0%3A358`              |

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
