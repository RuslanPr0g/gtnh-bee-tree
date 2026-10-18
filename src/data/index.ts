import beesJson from './bees.json';
import questsJson from './quests.json';
import namesJson from './names.json';
import { buildGraph, type RawData } from '../lib/graph';
import { buildQuestLine, type RawQuestLine } from '../lib/quests';
import type { Meanings } from '../lib/names';

// bees.json: dumped from a running GTNH 2.8.1 client (tools/beedump-agent)
// quests.json: extracted from the quest book files (tools/extract-quests.py)
// names.json: plain-language meaning of each bee name (tools/bee-names.mjs lists the names)
export const graph = buildGraph(beesJson as unknown as RawData);
export const questLine = buildQuestLine((questsJson as unknown as RawQuestLine[])[0], graph);
export const meanings: Meanings = namesJson;
