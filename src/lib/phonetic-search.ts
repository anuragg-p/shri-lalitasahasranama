/**
 * Phonetic fuzzy search over romanized Sanskrit names.
 *
 * Both the index (IAST transliterations) and user queries are folded into a
 * loose "search key" that erases the distinctions casual romanization can't
 * be trusted to make: diacritics, vowel length (a/ā, i/ī/ee, u/ū/oo),
 * aspiration (dh/d, bh/b…), sibilants (ś/ṣ/sh/s), and common variants
 * (w/v, f/ph, gy/jñ, x/kṣ). Because the same folding is applied to both
 * sides, "shri mata" and "śrīmātā" land on the identical key.
 *
 * On top of the folding, matching tolerates typos via a semi-global
 * (infix) edit distance, so "tanumadya" still finds tanumadhyā.
 */

export interface SearchEntry {
  /** DOM id of the word in the verses display (word-{line}-{index}) */
  id: string;
  /** The word exactly as it appears in the verse */
  devanagari: string;
  /** IAST transliteration, shown as the pronunciation */
  iast: string;
  /** Short English gloss for the result row */
  gloss: string;
  /** Precomputed folded search key */
  key: string;
}

export interface SearchResult extends SearchEntry {
  score: number;
}

/** Fold IAST or casually-typed romanization into a loose phonetic key. */
export function toSearchKey(input: string): string {
  let s = input.toLowerCase();
  // Strip diacritics: ā→a, ī→i, ś→s, ṣ→s, ṇ→n, ñ→n, ṅ→n, ṭ→t, ḍ→d, ṛ→r, ṃ→m, ḥ→h
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Fold digraphs and common typing variants. Order matters: doubled vowels
  // before ri/ru folds, chh before ch.
  s = s
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/ii/g, "i")
    .replace(/oo/g, "u")
    .replace(/uu/g, "u")
    .replace(/chh/g, "c")
    .replace(/ch/g, "c")
    .replace(/sh/g, "s")
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/jh/g, "j")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/ph/g, "p")
    .replace(/bh/g, "b")
    .replace(/dny/g, "jn")
    .replace(/gy/g, "jn")
    .replace(/x/g, "ks")
    .replace(/f/g, "p")
    .replace(/w/g, "v")
    .replace(/z/g, "j")
    // ṛ is typed "ri" or "ru" (amrita/amruta); folding is lossy but applied
    // to both sides, so genuine ri/ru sequences stay consistent too.
    .replace(/ri/g, "r")
    .replace(/ru/g, "r");
  s = s.replace(/[^a-z]/g, "");
  // Collapse geminates (anuttamā → anutama on both sides)
  s = s.replace(/(.)\1+/g, "$1");
  return s;
}

/** How many edits we forgive for a needle of the given length. */
function maxErrors(len: number): number {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  if (len <= 10) return 2;
  return 3;
}

/**
 * Semi-global (infix) edit distance: the cheapest way to align `needle`
 * against any substring of `hay`. Start and end positions in `hay` are free.
 */
export function infixDistance(needle: string, hay: string): number {
  const n = needle.length;
  const m = hay.length;
  if (n === 0) return 0;
  if (m === 0) return n;
  let prev: number[] = new Array<number>(m + 1).fill(0);
  let curr: number[] = new Array<number>(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      const cost = needle[i - 1] === hay[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (curr[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return Math.min(...prev);
}

/**
 * Rank entries against a typed query. Lower score = better; results are
 * sorted ascending. Matching tiers:
 *   0  exact key match
 *   1  key starts with the query
 *   2  query occurs inside the key
 *   2.x  key occurs inside the query (multi-name queries like
 *        "shri mata shri maharajni")
 *   3.x  fuzzy: token cover / query-in-key / key-in-query, cheapest wins
 */
export function searchEntries(
  entries: SearchEntry[],
  query: string,
  limit = 20,
): SearchResult[] {
  const concat = toSearchKey(query);
  if (concat.length < 3) return [];
  const tokens = query
    .split(/\s+/)
    .map(toSearchKey)
    .filter((t) => t.length > 0);

  const results: SearchResult[] = [];
  for (const entry of entries) {
    const key = entry.key;
    if (key.length === 0) continue;
    let score: number | null = null;

    if (key === concat) {
      score = 0;
    } else if (key.startsWith(concat)) {
      score = 1 + (key.length - concat.length) * 0.01;
    } else if (key.includes(concat)) {
      score = 2 + key.indexOf(concat) * 0.01;
    } else if (key.length >= 4 && concat.includes(key)) {
      // Longer covered keys rank higher within the tier
      score = 2.5 - Math.min(key.length, 24) * 0.01;
    } else {
      let best: number | null = null;
      // Every whitespace token fuzzily present in the key (multi-word queries)
      if (tokens.length > 1) {
        let total = 0;
        let allMatch = true;
        for (const token of tokens) {
          const d = infixDistance(token, key);
          if (d > maxErrors(token.length)) {
            allMatch = false;
            break;
          }
          total += d;
        }
        if (allMatch) best = 3 + total * 0.1;
      }
      // Whole query fuzzily inside the key (typo-tolerant lookup)
      const dQueryInKey = infixDistance(concat, key);
      if (dQueryInKey <= maxErrors(concat.length)) {
        const s = 3.3 + dQueryInKey * 0.15;
        if (best === null || s < best) best = s;
      }
      // Key fuzzily inside the query (multi-name queries with typos);
      // penalize keys that cover only a small part of what was typed.
      if (key.length >= 5) {
        const dKeyInQuery = infixDistance(key, concat);
        if (dKeyInQuery <= maxErrors(key.length)) {
          const s =
            3.4 +
            dKeyInQuery * 0.15 +
            Math.max(0, concat.length - key.length) * 0.03;
          if (best === null || s < best) best = s;
        }
      }
      score = best;
    }

    if (score !== null) results.push({ ...entry, score });
  }

  results.sort((a, b) => a.score - b.score);
  return results.slice(0, limit);
}
