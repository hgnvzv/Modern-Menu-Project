/* Arabic-aware text normalization for search: strip diacritics/tatweel, unify
   letter variants, and collapse whitespace so "قهوتها" matches "قهوة" etc. */

const DIACRITICS = /[\u064B-\u0652\u0640]/g;

export function normalizeArabic(input: string): string {
  return input
    .replace(DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** True if `haystack` contains the normalized `needle` (both normalized). */
export function matchesQuery(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return normalizeArabic(haystack).includes(normalizeArabic(needle));
}
