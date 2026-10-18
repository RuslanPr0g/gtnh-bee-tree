// Plain-language meanings of bee names (src/data/names.json, kept in sync by tools/bee-names.mjs).

export type Meanings = Record<string, string>;

/** Google Translate with the text filled in; the source language is detected and the
 * target is left to Google (the user's last choice), so the user picks it there. */
export const translateUrl = (text: string) =>
  `https://translate.google.com/?sl=auto&op=translate&text=${encodeURIComponent(text)}`;

/** Names in `names` without a non-empty meaning. */
export const missingMeanings = (names: Iterable<string>, meanings: Meanings) =>
  [...new Set(names)].filter((n) => !meanings[n]?.trim());
