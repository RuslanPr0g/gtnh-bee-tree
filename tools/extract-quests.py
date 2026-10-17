import json, glob, os, re, sys
base, out = sys.argv[1], sys.argv[2]
def strip(o):
    if isinstance(o, dict): return {k.split(':')[0]: strip(v) for k, v in o.items()}
    return o
def qid(d): return f"{d.get('questIDHigh', 0)}:{d.get('questIDLow', 0)}"
def clean(s): return re.sub(r'§.', '', s or '')
def species(item):
    try: return item['tag']['Genome']['Chromosomes']['0']['UID0']
    except Exception: return None

# every quest in the pack, so prerequisites outside the bee lines still get a name
allq = {}
for f in glob.glob(f'{base}/Quests/*/*.json'):
    d = strip(json.load(open(f)))
    p = d['properties']['betterquesting']
    bees = []
    for t in d.get('tasks', {}).values():
        for it in (t.get('requiredItems') or {}).values():
            s = species(it)
            if s and s not in bees: bees.append(s)
    allq[qid(d)] = {'id': qid(d), 'name': clean(p.get('name')), 'desc': clean(p.get('desc')),
                    'bees': bees, 'icon': species(p.get('icon') or {}), 'iconItem': (p.get('icon') or {}).get('id'),
                    'pre': [qid(x) for x in (d.get('preRequisites') or {}).values()]}

lines = []
for name in ['BeeBreeding', 'HowtoBee']:
    dirs = glob.glob(f'{base}/QuestLines/{name}-*')
    if not dirs: continue
    meta = strip(json.load(open(f'{dirs[0]}/QuestLine.json')))['properties']['betterquesting']
    nodes = []
    for f in glob.glob(f'{dirs[0]}/*.json'):
        if f.endswith('QuestLine.json'): continue
        e = strip(json.load(open(f)))
        q = allq.get(qid(e))
        if q: nodes.append({**q, 'x': e['x'], 'y': e['y'], 'w': e.get('sizeX', 24), 'h': e.get('sizeY', 24)})
    ids = {n['id'] for n in nodes}
    extern = {p: allq[p]['name'] for n in nodes for p in n['pre'] if p not in ids and p in allq}
    lines.append({'key': name, 'name': clean(meta.get('name')), 'desc': clean(meta.get('desc')), 'nodes': nodes, 'extern': extern})
json.dump(lines, open(out, 'w'), ensure_ascii=False)
for l in lines: print(l['name'], len(l['nodes']), 'quests', sum(1 for n in l['nodes'] if n['bees']), 'with bees', len(l['extern']), 'outside prereqs')
