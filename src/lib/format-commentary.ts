/**
 * Reading-rhythm helpers for V. Ravi commentary text.
 *
 * The source is a single dense block per nāma — we split it into:
 *   - a short lede (the first 1-2 sentences, ≤ ~180 chars)
 *   - body paragraphs of roughly 3-5 sentences, with smart breaks at
 *     topic-shift cues (scripture references, transition words, asides).
 */

const TOPIC_SHIFT_CUES = [
  // Common scripture / source citations that usually begin a new thought
  /^(Bṛhadāraṇyaka|Chāndogya|Taittirīya|Śvetāśvatara|Kena|Praśna|Māṇḍūkya|Muṇḍaka|Kaṭha|Aitareya|Īśa)\b/,
  /^(Saundarya|Bhagavad|Lalitā|Śrī|Soundarya)\b/,
  /^(Kṛṣṇa|Śiva|Viṣṇu|Brahmā|Devī|Lakṣmī|Sarasvatī|Durvāsā|Vasiṣṭha|Vyāsa)\s+(says|said|teaches|describes|writes)/,
  // Transition / continuation words
  /^(However|Therefore|Thus|Hence|Now|Also|Further|Additionally|Moreover|Furthermore|Besides|Yet|Still)\b/,
  /^(A reference|Another|It is also|Yet another|Other meaning)/,
  // Parenthetical asides
  /^[{(]/,
];

const MAX_SENTENCES_PER_PARAGRAPH = 5;
const MIN_SENTENCES_PER_PARAGRAPH = 2;
const LEDE_MAX_CHARS = 180;

/**
 * Split text into sentences. Uses a punctuation-then-capital lookahead and
 * avoids splitting common abbreviations (i.e., e.g., etc.).
 */
function tokenizeSentences(text: string): string[] {
  // Split on ". " (or "? " / "! ") when followed by an uppercase letter,
  // a Devanagari char, or an opening quote/paren.
  const raw = text.split(
    /(?<=[.!?])\s+(?=[A-ZĀĪŪṚṢṬṆṂḤŚŔ"'(ऀ-ॿ])/u,
  );
  // Merge back false splits after common abbreviations.
  const merged: string[] = [];
  const abbr = /\b(i\.e|e\.g|etc|cf|viz|Sk|Mr|Dr|St|Mt|A\.D|B\.C|p|pp|vol|no|verse|verses)\.$/i;
  for (const s of raw) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const last = merged[merged.length - 1];
    if (last && abbr.test(last)) {
      merged[merged.length - 1] = `${last} ${trimmed}`;
    } else {
      merged.push(trimmed);
    }
  }
  return merged;
}

/** Returns true if this sentence is a strong topic-shift cue (force new paragraph) */
function isTopicShift(sentence: string): boolean {
  return TOPIC_SHIFT_CUES.some((re) => re.test(sentence));
}

/**
 * Split body text into paragraphs of roughly 3-5 sentences.
 * Forces a break BEFORE a topic-shift cue (so the cue starts a new paragraph)
 * and falls back to a length cap of MAX_SENTENCES_PER_PARAGRAPH.
 */
export function splitIntoParagraphs(text: string): string[] {
  const sentences = tokenizeSentences(text);
  if (sentences.length === 0) return [];

  const paragraphs: string[][] = [[]];
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]!;
    const current = paragraphs[paragraphs.length - 1]!;
    const wouldShiftTopic =
      isTopicShift(sentence) && current.length >= MIN_SENTENCES_PER_PARAGRAPH;
    const wouldOverflow = current.length >= MAX_SENTENCES_PER_PARAGRAPH;

    if ((wouldShiftTopic || wouldOverflow) && current.length > 0) {
      paragraphs.push([sentence]);
    } else {
      current.push(sentence);
    }
  }

  return paragraphs
    .map((sents) => sents.join(" ").trim())
    .filter((p) => p.length > 0);
}

/**
 * Pull the opening 1-2 sentences out as a lede. Returns the lede plus the
 * remaining body text. Falls back to no lede if the first sentence alone is
 * already too long.
 */
export function extractLede(text: string): { lede: string; body: string } {
  const sentences = tokenizeSentences(text);
  if (sentences.length < 3) {
    // Not enough body to justify a lede separation
    return { lede: "", body: text };
  }

  let lede = sentences[0]!;
  let consumed = 1;
  // If the first sentence is very short (< 60 chars), pull the second in too
  if (lede.length < 60 && sentences[1]) {
    const candidate = `${lede} ${sentences[1]}`;
    if (candidate.length <= LEDE_MAX_CHARS) {
      lede = candidate;
      consumed = 2;
    }
  }

  if (lede.length > LEDE_MAX_CHARS) {
    return { lede: "", body: text };
  }

  const body = sentences.slice(consumed).join(" ").trim();
  return { lede, body };
}
