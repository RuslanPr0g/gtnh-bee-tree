package beedump;

import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Collection;
import java.util.Map;

public class Agent {
    static ClassLoader cl;

    public static void agentmain(String out) {
        StringBuilder log = new StringBuilder();
        try {
            for (Thread t : Thread.getAllStackTraces().keySet()) {
                ClassLoader c = t.getContextClassLoader();
                if (c == null) continue;
                try { Class.forName("forestry.api.genetics.AlleleManager", false, c); cl = c; break; } catch (Throwable ignored) {}
            }
            if (cl == null) throw new RuntimeException("no forestry classloader");
            String json = dump();
            try (Writer w = new OutputStreamWriter(new FileOutputStream(out), "UTF-8")) { w.write(json); }
        } catch (Throwable t) {
            try (Writer w = new OutputStreamWriter(new FileOutputStream(out + ".err"), "UTF-8")) {
                java.io.StringWriter sw = new java.io.StringWriter();
                t.printStackTrace(new java.io.PrintWriter(sw));
                w.write(sw.toString());
            } catch (Throwable ignored) {}
        }
    }

    static Object call(Object o, String iface, String m, Object... args) throws Exception {
        Class<?> c = Class.forName(iface, false, cl);
        Class<?>[] types = new Class<?>[args.length];
        for (int i = 0; i < args.length; i++) types[i] = args[i] instanceof Integer ? int.class : args[i] instanceof Boolean ? boolean.class : args[i].getClass();
        Method mm = c.getMethod(m, types);
        return mm.invoke(o, args);
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

    static String s(Object o, String iface, String m) {
        try { return q(call(o, iface, m)); } catch (Throwable t) { return "null"; }
    }

    static String stackName(Object st) {
        try { return String.valueOf(st.getClass().getMethod("func_82833_r").invoke(st)); } catch (Throwable t) { return String.valueOf(st); }
    }

    static String products(Object map) {
        StringBuilder b = new StringBuilder("[");
        if (map != null) for (Map.Entry<?, ?> e : ((Map<?, ?>) map).entrySet()) {
            if (b.length() > 1) b.append(',');
            b.append("{\"item\":").append(q(stackName(e.getKey()))).append(",\"chance\":").append(e.getValue()).append('}');
        }
        return b.append(']').toString();
    }

    static String dump() throws Exception {
        final String SP = "forestry.api.genetics.IAlleleSpecies", BS = "forestry.api.apiculture.IAlleleBeeSpecies",
                AL = "forestry.api.genetics.IAllele", REG = "forestry.api.genetics.IAlleleRegistry",
                MU = "forestry.api.genetics.IMutation", CLS = "forestry.api.genetics.IClassification";
        Class<?> am = Class.forName("forestry.api.genetics.AlleleManager", true, cl);
        Object reg = am.getField("alleleRegistry").get(null);
        Class<?> beeIface = Class.forName(BS, false, cl);
        Object root = call(reg, REG, "getSpeciesRoot", "rootBees");
        StringBuilder sb = new StringBuilder("{\"species\":[");
        boolean first = true;
        for (Object a : ((Map<?, ?>) call(reg, REG, "getRegisteredAlleles")).values()) {
            if (!beeIface.isInstance(a)) continue;
            String uid = (String) call(a, AL, "getUID");
            if ((Boolean) call(reg, REG, "isBlacklisted", uid)) continue;
            if (!first) sb.append(",\n");
            first = false;
            Object br = call(a, SP, "getBranch");
            Object temp = call(a, SP, "getTemperature"), hum = call(a, SP, "getHumidity");
            sb.append("{\"uid\":").append(q(uid))
              .append(",\"name\":").append(s(a, AL, "getName"))
              .append(",\"binomial\":").append(s(a, SP, "getBinomial"))
              .append(",\"authority\":").append(s(a, SP, "getAuthority"))
              .append(",\"description\":").append(s(a, SP, "getDescription"))
              .append(",\"branch\":").append(br == null ? "null" : s(br, CLS, "getName"))
              .append(",\"branchSci\":").append(br == null ? "null" : s(br, CLS, "getScientific"))
              .append(",\"temp\":").append(q(temp == null ? null : ((Enum<?>) temp).name()))
              .append(",\"humidity\":").append(q(hum == null ? null : ((Enum<?>) hum).name()))
              .append(",\"nocturnal\":").append(call(a, BS, "isNocturnal"))
              .append(",\"dominant\":").append(call(a, AL, "isDominant"))
              .append(",\"secret\":").append(call(a, SP, "isSecret"))
              .append(",\"glow\":").append(call(a, SP, "hasEffect"))
              .append(",\"color\":").append(call(a, SP, "getIconColour", 0))
              .append(",\"color2\":").append(call(a, SP, "getIconColour", 1))
              .append(",\"products\":").append(products(call(a, BS, "getProductChances")))
              .append(",\"specialty\":").append(products(call(a, BS, "getSpecialtyChances")))
              .append('}');
        }
        sb.append("],\n\"mutations\":[");
        first = true;
        for (Object m : (Collection<?>) call(root, "forestry.api.genetics.ISpeciesRoot", "getMutations", false)) {
            Object[] tpl = (Object[]) call(m, MU, "getTemplate");
            if (tpl == null || tpl.length == 0 || tpl[0] == null) continue;
            if (!first) sb.append(",\n");
            first = false;
            sb.append("{\"a\":").append(s(call(m, MU, "getAllele0"), AL, "getUID"))
              .append(",\"b\":").append(s(call(m, MU, "getAllele1"), AL, "getUID"))
              .append(",\"result\":").append(s(tpl[0], AL, "getUID"))
              .append(",\"chance\":").append(call(m, MU, "getBaseChance"))
              .append(",\"secret\":").append(call(m, MU, "isSecret"))
              .append(",\"conditions\":[");
            boolean f2 = true;
            Collection<?> conds = (Collection<?>) call(m, MU, "getSpecialConditions");
            if (conds != null) for (Object c : conds) { if (!f2) sb.append(','); f2 = false; sb.append(q(c)); }
            sb.append("]}");
        }
        return sb.append("]}\n").toString();
    }
}
