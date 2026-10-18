# Data tools

Both tools write the JSON files in `src/data/`. Run them again after a GTNH pack update, then `npm run format` (CI checks formatting, data included) and `npm test`.

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
Names are dumped in the client's language. Some GregTech branch names come out as raw keys (`for.genus.bees.radioactive`), and the app cleans those up (`src/lib/graph.ts`).

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
