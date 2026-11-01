package combdump;

import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

// Reads what each comb turns into in machines (GregTech recipe maps + Forestry centrifuge).
// Argument: "<names.txt>|<out.json>", names.txt has one item name per line (the combs).
public class Agent {
    static ClassLoader cl;

    public static void agentmain(String arg) {
        String[] a = arg.split("\\|");
        String out = a[1];
        try {
            for (Thread t : Thread.getAllStackTraces().keySet()) {
                ClassLoader c = t.getContextClassLoader();
                if (c == null) continue;
                try { Class.forName("gregtech.api.recipe.RecipeMap", false, c); cl = c; break; } catch (Throwable ignored) {}
            }
            if (cl == null) throw new RuntimeException("no gregtech classloader");
            Set<String> names = new HashSet<>();
            for (String l : Files.readAllLines(Paths.get(a[0]), java.nio.charset.StandardCharsets.UTF_8)) if (!l.isEmpty()) names.add(l);
            String json = dump(names);
            try (Writer w = new OutputStreamWriter(new FileOutputStream(out), "UTF-8")) { w.write(json); }
        } catch (Throwable t) {
            try (Writer w = new OutputStreamWriter(new FileOutputStream(out + ".err"), "UTF-8")) {
                java.io.StringWriter sw = new java.io.StringWriter();
                t.printStackTrace(new java.io.PrintWriter(sw));
                w.write(sw.toString());
            } catch (Throwable ignored) {}
        }
    }

    static String q(Object o) {
        if (o == null) return "null";
        StringBuilder b = new StringBuilder("\"");
        for (char c : o.toString().toCharArray()) {
            if (c == '"' || c == '\\') b.append('\\').append(c);
            else if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
            else b.append(c);
        }
        return b.append('"').toString();
    }

    static String name(Object st) {
        try { return String.valueOf(st.getClass().getMethod("func_82833_r").invoke(st)); } catch (Throwable t) { return String.valueOf(st); }
    }

    static int size(Object st) {
        try { return st.getClass().getField("field_77994_a").getInt(st); } catch (Throwable t) { return 1; }
    }

    static String fluidName(Object fs) {
        try { return String.valueOf(fs.getClass().getMethod("getLocalizedName").invoke(fs)); } catch (Throwable t) { return String.valueOf(fs); }
    }

    static int fluidAmount(Object fs) {
        try { return fs.getClass().getField("amount").getInt(fs); } catch (Throwable t) { return 0; }
    }

    static String translate(String key) {
        try {
            Object v = Class.forName("net.minecraft.util.StatCollector", true, cl).getMethod("func_74838_a", String.class).invoke(null, key);
            return String.valueOf(v);
        } catch (Throwable t) { return key; }
    }

    static String items(Object[] st, int[] chances) {
        StringBuilder b = new StringBuilder("[");
        if (st != null) for (int i = 0; i < st.length; i++) {
            if (st[i] == null || name(st[i]).startsWith("Programmed Circuit")) continue;
            if (b.length() > 1) b.append(',');
            b.append("{\"item\":").append(q(name(st[i]))).append(",\"n\":").append(size(st[i]));
            if (chances != null && chances[i] < 10000) b.append(",\"chance\":").append(chances[i] / 10000.0);
            b.append('}');
        }
        return b.append(']').toString();
    }

    static String fluids(Object[] fs) {
        StringBuilder b = new StringBuilder("[");
        if (fs != null) for (Object f : fs) {
            if (f == null) continue;
            if (b.length() > 1) b.append(',');
            b.append("{\"item\":").append(q(fluidName(f))).append(",\"mb\":").append(fluidAmount(f)).append('}');
        }
        return b.append(']').toString();
    }

    static void add(Map<String, List<String>> by, String key, String rec) {
        by.computeIfAbsent(key, k -> new java.util.ArrayList<>());
        if (!by.get(key).contains(rec)) by.get(key).add(rec);
    }

    // multiblock copies of single-block recipes add nothing for the reader
    static final Set<String> SKIP = new HashSet<>(java.util.Arrays.asList(
            "Multiblock Centrifuge", "Large Chemical Reactor", "Multiblock Dehydrator", "Multiblock Electrolyzer",
            "Multiblock Mixer", "Helioflux Melting Core"));

    static String dump(Set<String> names) throws Exception {
        Map<String, List<String>> by = new java.util.TreeMap<>();
        Class<?> rm = Class.forName("gregtech.api.recipe.RecipeMap", true, cl);
        Class<?> gr = Class.forName("gregtech.api.util.GTRecipe", true, cl);
        Map<?, ?> maps = (Map<?, ?>) rm.getField("ALL_RECIPE_MAPS").get(null);
        for (Object map : maps.values()) {
            String key = (String) rm.getField("unlocalizedName").get(map);
            String machine = translate(key);
            if (SKIP.contains(machine)) continue;
            for (Object r : (Collection<?>) rm.getMethod("getAllRecipes").invoke(map)) {
                if (!gr.getField("mEnabled").getBoolean(r) || gr.getField("mHidden").getBoolean(r)) continue;
                Object[] in = (Object[]) gr.getField("mInputs").get(r);
                if (in == null) continue;
                String hit = null;
                for (Object st : in) if (st != null && names.contains(name(st))) { hit = name(st); break; }
                if (hit == null) continue;
                Object[] outs = (Object[]) gr.getField("mOutputs").get(r);
                int[] ch = new int[outs == null ? 0 : outs.length];
                for (int i = 0; i < ch.length; i++) ch[i] = (Integer) gr.getMethod("getOutputChance", int.class).invoke(r, i);
                String rec = "{\"machine\":" + q(machine) + ",\"eut\":" + gr.getField("mEUt").getInt(r)
                        + ",\"ticks\":" + gr.getField("mDuration").getInt(r)
                        + ",\"in\":" + items(in, null) + ",\"fluidIn\":" + fluids((Object[]) gr.getField("mFluidInputs").get(r))
                        + ",\"out\":" + items(outs, ch) + ",\"fluidOut\":" + fluids((Object[]) gr.getField("mFluidOutputs").get(r)) + "}";
                add(by, hit, rec);
            }
        }
        try {
            Class<?> mgrs = Class.forName("forestry.api.recipes.RecipeManagers", true, cl);
            Object cm = mgrs.getField("centrifugeManager").get(null);
            Class<?> cr = Class.forName("forestry.api.recipes.ICentrifugeRecipe", true, cl);
            for (Object r : (Collection<?>) Class.forName("forestry.api.recipes.ICraftingProvider", true, cl).getMethod("recipes").invoke(cm)) {
                Object in = cr.getMethod("getInput").invoke(r);
                if (in == null || !names.contains(name(in))) continue;
                StringBuilder o = new StringBuilder("[");
                for (Map.Entry<?, ?> e : ((Map<?, ?>) cr.getMethod("getAllProducts").invoke(r)).entrySet()) {
                    if (o.length() > 1) o.append(',');
                    o.append("{\"item\":").append(q(name(e.getKey()))).append(",\"n\":").append(size(e.getKey()));
                    float c = (Float) e.getValue();
                    if (c < 1f) o.append(",\"chance\":").append(Math.round(c * 10000) / 10000.0);
                    o.append('}');
                }
                o.append(']');
                add(by, name(in), "{\"machine\":\"Forestry Centrifuge\",\"eut\":0,\"ticks\":" + cr.getMethod("getProcessingTime").invoke(r)
                        + ",\"in\":" + items(new Object[] {in}, null) + ",\"fluidIn\":[],\"out\":" + o + ",\"fluidOut\":[]}");
            }
        } catch (Throwable t) {
            // Forestry centrifuge is optional; GregTech recipes are the main data
        }
        StringBuilder sb = new StringBuilder("{");
        for (Map.Entry<String, List<String>> e : by.entrySet()) {
            if (sb.length() > 1) sb.append(',');
            sb.append(q(e.getKey())).append(":[").append(String.join(",", e.getValue())).append(']');
        }
        return sb.append('}').toString();
    }
}
