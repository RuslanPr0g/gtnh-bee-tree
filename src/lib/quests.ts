// The "Be(e) Breeding" questline from the GTNH quest book (BetterQuesting), laid out like in game.
import type { Graph } from './graph';

export interface RawQuest {
  id: string;
  name: string;
  desc: string;
  bees: string[];
  icon: string | null;
  iconItem: string | null;
  pre: string[];
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RawQuestLine {
  key: string;
  name: string;
  desc: string;
  nodes: RawQuest[];
  /** prerequisites that live in other questlines: id -> name */
  extern: Record<string, string>;
}

export interface Quest extends RawQuest {
  /** the bee shown as the quest's icon */
  main: string | undefined;
  next: string[];
  /** pixel layout on the map */
  px: number;
  py: number;
  ps: number;
}

export interface QuestLine {
  name: string;
  nodes: Quest[];
  byId: Record<string, Quest>;
  extern: Record<string, string>;
  /** bee uid -> quests where it is the main bee */
  questOf: Record<string, string[]>;
  width: number;
  height: number;
}

const SCALE = 1.3;
const PAD = 30;

export function buildQuestLine(raw: RawQuestLine, g: Graph): QuestLine {
  const minX = Math.min(...raw.nodes.map((n) => n.x));
  const minY = Math.min(...raw.nodes.map((n) => n.y));
  const byId: Record<string, Quest> = {};
  const nodes = raw.nodes.map((n): Quest => {
    const q: Quest = {
      ...n,
      main: n.icon && g.byId[n.icon] ? n.icon : n.bees[n.bees.length - 1],
      next: [],
      px: (n.x - minX) * SCALE + PAD,
      py: (n.y - minY) * SCALE + PAD,
      ps: n.w * SCALE,
    };
    byId[q.id] = q;
    return q;
  });
  const questOf: Record<string, string[]> = {};
  for (const n of nodes) {
    for (const p of n.pre) byId[p]?.next.push(n.id);
    if (n.main) (questOf[n.main] ??= []).push(n.id);
  }
  return {
    name: raw.name,
    nodes,
    byId,
    extern: raw.extern,
    questOf,
    width: Math.max(...nodes.map((n) => n.px + n.ps)) + PAD * 3,
    height: Math.max(...nodes.map((n) => n.py + n.ps)) + PAD * 2,
  };
}

/** all quests needed before this one, in an order you can do them (prerequisites first) */
export function questPath(ql: QuestLine, id: string): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const walk = (x: string) => {
    if (seen.has(x) || !ql.byId[x]) return;
    seen.add(x);
    ql.byId[x].pre.forEach(walk);
    order.push(x);
  };
  walk(id);
  return order;
}

export function questMatches(n: Quest, g: Graph, words: string[]): boolean {
  if (!words.length) return true;
  const hay = [n.name, ...n.bees.map((b) => g.byId[b]?.name ?? b)].join(' ').toLowerCase();
  return words.every((w) => hay.includes(w));
}

export const questDone = (n: Quest, have: Set<string>) =>
  n.bees.length > 0 && n.bees.every((b) => have.has(b));

export const firstQuest = (ql: QuestLine) =>
  ql.nodes.find((n) => !n.pre.some((p) => ql.byId[p]))?.id ?? ql.nodes[0].id;
