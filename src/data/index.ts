import beesJson from './bees.json';
import questsJson from './quests.json';
import namesJson from './names.json';
import combsJson from './combs.json';
import effectsJson from './effects.json';
import { buildGraph, type RawData } from '../lib/graph';
import { buildQuestLine, type RawQuestLine } from '../lib/quests';
import type { Meanings } from '../lib/names';
import type { CombData } from '../lib/combs';
import { effectOf, type EffectData, type EffectInfo } from '../lib/effects';

// bees.json: dumped from a running GTNH 2.9.0 client (tools/beedump-agent)
// quests.json: extracted from the quest book files (tools/extract-quests.py)
// combs.json: what each comb turns into in machines (tools/combdump-agent)
// effects.json: what each bee effect does, checked against the mod code (by hand)
// names.json: plain-language meaning of each bee name (tools/bee-names.mjs lists the names)
export const graph = buildGraph(beesJson as unknown as RawData);
export const questLine = buildQuestLine((questsJson as unknown as RawQuestLine[])[0], graph);
export const meanings: Meanings = namesJson;
export const combs = combsJson as unknown as CombData;
export const effects = effectsJson as EffectData;
/** the bee's effect (null for "None"), by species uid */
export const effectFor = (uid: string): EffectInfo | null =>
  effectOf(effects, graph.byId[uid]?.effect ?? null);
