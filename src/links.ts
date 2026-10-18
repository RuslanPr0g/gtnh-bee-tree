// Path helpers bound to the app's dataset (see lib/paths.ts for the URL scheme).
import { graph, questLine } from './data';
import { beePath as beePathOf, questPath as questPathOf } from './lib/paths';

export { DEFAULT_BEE, QUESTS } from './lib/paths';
export const beePath = (uid: string) => beePathOf(graph, uid);
export const questPath = (id: string) => questPathOf(questLine, id);
