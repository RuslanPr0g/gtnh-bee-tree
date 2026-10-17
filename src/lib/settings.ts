// Move the user's marks between browsers/devices: everything is packed into a link
// (#/import?d=<base64url JSON>), so no server or account is needed.
import { KEYS, load, save } from './storage';

const ALL_KEYS = Object.values(KEYS);
type Settings = Partial<Record<(typeof ALL_KEYS)[number], unknown>>;

const toBase64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (s: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
  );

export function encodeSettings(s: Settings): string {
  return toBase64Url(JSON.stringify(s));
}

/** null when the text isn't a settings object; unknown keys are dropped (the app validates values on load) */
export function decodeSettings(d: string): Settings | null {
  try {
    const v: unknown = JSON.parse(fromBase64Url(d));
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    const out: Settings = {};
    for (const k of ALL_KEYS) if (k in v) out[k] = (v as Record<string, unknown>)[k];
    return out;
  } catch {
    return null;
  }
}

export const readSettings = (): Settings =>
  Object.fromEntries(ALL_KEYS.map((k) => [k, load<unknown>(k, null)]).filter(([, v]) => v != null));

export const writeSettings = (s: Settings) => {
  for (const [k, v] of Object.entries(s)) save(k, v);
};

/** link that imports this browser's settings when opened */
export const settingsLink = () =>
  `${location.origin}${location.pathname}#/import?d=${encodeSettings(readSettings())}`;
