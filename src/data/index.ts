import beesJson from './bees.json';
import questsJson from './quests.json';
import { buildGraph, type RawData } from '../lib/graph';
import { buildQuestLine, type RawQuestLine } from '../lib/quests';

// bees.json: dumped from a running GTNH 2.8.1 client (tools/beedump-agent)
// quests.json: extracted from the quest book files (tools/extract-quests.py)
export const graph = buildGraph(beesJson as unknown as RawData);
export const questLine = buildQuestLine((questsJson as unknown as RawQuestLine[])[0], graph);
