/**
 * Devanagari → IAST transliteration, self-contained (no dependencies).
 * Covers the classical Sanskrit inventory used in the verse text:
 * consonants, independent vowels, matras, virama, anusvāra, visarga,
 * candrabindu, avagraha, ॐ, daṇḍas and digits. Unknown characters
 * (Latin text, punctuation, whitespace) pass through unchanged.
 */

const CONSONANTS: Record<string, string> = {
  क: "k",
  ख: "kh",
  ग: "g",
  घ: "gh",
  ङ: "ṅ",
  च: "c",
  छ: "ch",
  ज: "j",
  झ: "jh",
  ञ: "ñ",
  ट: "ṭ",
  ठ: "ṭh",
  ड: "ḍ",
  ढ: "ḍh",
  ण: "ṇ",
  त: "t",
  थ: "th",
  द: "d",
  ध: "dh",
  न: "n",
  प: "p",
  फ: "ph",
  ब: "b",
  भ: "bh",
  म: "m",
  य: "y",
  र: "r",
  ल: "l",
  व: "v",
  श: "ś",
  ष: "ṣ",
  स: "s",
  ह: "h",
  ळ: "ḻ",
};

const INDEPENDENT_VOWELS: Record<string, string> = {
  अ: "a",
  आ: "ā",
  इ: "i",
  ई: "ī",
  उ: "u",
  ऊ: "ū",
  ऋ: "ṛ",
  ॠ: "ṝ",
  ऌ: "ḷ",
  ॡ: "ḹ",
  ए: "e",
  ऐ: "ai",
  ओ: "o",
  औ: "au",
};

const MATRAS: Record<string, string> = {
  "ा": "ā",
  "ि": "i",
  "ी": "ī",
  "ु": "u",
  "ू": "ū",
  "ृ": "ṛ",
  "ॄ": "ṝ",
  "ॢ": "ḷ",
  "ॣ": "ḹ",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
};

const VIRAMA = "्";

const SIGNS: Record<string, string> = {
  "ं": "ṃ",
  "ः": "ḥ",
  "ँ": "m̐",
  ऽ: "'",
  ॐ: "oṃ",
  "।": "|",
  "॥": "||",
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
  "‌": "",
  "‍": "",
};

export function devanagariToIAST(text: string): string {
  let out = "";
  // A consonant carries an inherent "a" unless followed by a matra or virama.
  let pendingA = false;
  for (const ch of text) {
    const consonant = CONSONANTS[ch];
    if (consonant !== undefined) {
      if (pendingA) out += "a";
      out += consonant;
      pendingA = true;
      continue;
    }
    const matra = MATRAS[ch];
    if (matra !== undefined) {
      out += matra;
      pendingA = false;
      continue;
    }
    if (ch === VIRAMA) {
      pendingA = false;
      continue;
    }
    const vowel = INDEPENDENT_VOWELS[ch];
    if (vowel !== undefined) {
      if (pendingA) out += "a";
      out += vowel;
      pendingA = false;
      continue;
    }
    if (pendingA) {
      out += "a";
      pendingA = false;
    }
    out += SIGNS[ch] ?? ch;
  }
  if (pendingA) out += "a";
  return out;
}
