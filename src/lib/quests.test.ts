import { describe, expect, it } from 'vitest';
import { questLine as ql } from '../data';
import { questEdges, questPath } from './quests';

describe('quests', () => {
  it('lists prerequisites before the quest', () => {
    const path = questPath(ql, '0:358');
    expect(path.at(-1)).toBe('0:358');
    for (const [i, id] of path.entries())
      for (const p of ql.byId[id].pre) if (ql.byId[p]) expect(path.indexOf(p)).toBeLessThan(i);
  });

  it('draws map lines from box border to box border', () => {
    const edges = questEdges(ql);
    expect(edges).toHaveLength(ql.nodes.flatMap((n) => n.pre.filter((p) => ql.byId[p])).length);
    const inside = (x: number, y: number, id: string) => {
      const n = ql.byId[id];
      return x > n.px && x < n.px + n.ps && y > n.py && y < n.py + n.ps;
    };
    for (const e of edges) {
      expect(inside(e.x1, e.y1, e.from)).toBe(false);
      expect(inside(e.x2, e.y2, e.to)).toBe(false);
    }
  });
});
