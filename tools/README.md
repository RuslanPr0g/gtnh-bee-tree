# Data tools

These tools write the JSON files in `src/data/`. Run them again after a GTNH pack update, then `npm run format` (CI checks formatting, data included) and `npm test`.

## `beedump-agent/` → `src/data/bees.json`

Mods register bees in code, so the list is read from a **running** GTNH client with a tiny Java agent.
It only reads Forestry's allele registry (by reflection) and writes JSON. Nothing in the game or world changes, and no restart is needed.

```bash
JDK=~/.local/share/PrismLauncher/java/java-runtime-epsilon/bin   # any JDK 17+ with jcmd
mkdir -p /tmp/beedump/out
$JDK/javac -d /tmp/beedump/out tools/beedump-agent/Agent.java
printf 'Agent-Class: beedump.Agent\n' > /tmp/beedump/manifest.txt
$JDK/jar cfm /tmp/beedump/agent.jar /tmp/beedump/manifest.txt -C /tmp/beedump/out .

PID=$(pgrep -f 'GT_New_Horizons.*EntryPoint')                       # the running game
$JDK/jcmd $PID JVMTI.agent_load /tmp/beedump/agent.jar "$PWD/src/data/bees.json"
```

If something fails, the agent writes `bees.json.err` with the stack trace.
Each species also gets its `effect` (the effect allele of its default genome). What an effect does is written by hand in `src/data/effects.json`; `src/lib/effects.test.ts` fails when a bee has an effect with no entry there.
Names are dumped in the client's language. Some GregTech branch names come out as raw keys (`for.genus.bees.radioactive`), and the app cleans those up (`src/lib/graph.ts`).

## `combdump-agent/` → `src/data/combs.json`

What each comb turns into in machines (GregTech recipe maps and the Forestry centrifuge), read from the running game the same way.
Multiblock copies of single-block recipes and programmed circuits are left out.
Agents stay loaded in the game, so if you load it twice in one game session, change the package name first (the old class would be reused).

```bash
mkdir -p /tmp/combdump/out
python3 -c "import json;d=json.load(open('src/data/bees.json'));print('\\n'.join(sorted({p['item'] for s in d['species'] for p in s['products']+s['specialty'] if p['item'].endswith('Comb')})))" > /tmp/combdump/names.txt
$JDK/javac -d /tmp/combdump/out tools/combdump-agent/Agent.java
printf 'Agent-Class: combdump.Agent\n' > /tmp/combdump/manifest.txt
$JDK/jar cfm /tmp/combdump/agent.jar /tmp/combdump/manifest.txt -C /tmp/combdump/out .
$JDK/jcmd $PID JVMTI.agent_load /tmp/combdump/agent.jar "/tmp/combdump/names.txt|$PWD/src/data/combs.json"
```

## `extract-quests.py` → `src/data/quests.json`

Reads the BetterQuesting default quest files (no game needed):

```bash
python3 tools/extract-quests.py \
  ~/.local/share/PrismLauncher/instances/<GTNH instance>/.minecraft/config/betterquesting/DefaultQuests \
  src/data/quests.json
```

The app uses the first questline in the file (`BeeBreeding`, "Be(e) Breeding").

## `bee-names.mjs` → `src/data/names.json`

Each bee name with a short plain-language meaning, shown when the name is clicked in the bee detail.
After `bees.json` changes, run it to add new names (with an empty meaning) and drop names that are gone, then fill in the empty ones:

```bash
node tools/bee-names.mjs            # sync the keys
node tools/bee-names.mjs --missing  # list names that still need a meaning
```

`src/lib/names.test.ts` fails while any name has no meaning.
