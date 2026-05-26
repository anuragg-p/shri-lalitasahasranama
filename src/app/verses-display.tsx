"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VersesDisplayProps {
  sanskritText: string;
  commentaries: Record<string, Record<string, string>>; // commentary name -> word -> commentary text
}

interface WordWithCommentary {
  id: string;
  word: string;
  lineIndex: number;
  wordIndex: number;
  commentariesBySource: Record<string, string>;
  breakdownComponents?: string[];
}

/**
 * Parse a verse line into words, preserving dashes within compound words
 * Also handles square bracket breakdowns: word [component1 + component2 + component3](number)
 */
function parseWordsFromLine(
  line: string,
): Array<{ word: string; isWord: boolean; breakdownComponents?: string[] }> {
  const result: Array<{
    word: string;
    isWord: boolean;
    breakdownComponents?: string[];
  }> = [];

  // First, extract and remove square bracket breakdowns: word [component1 + component2](number) or word [component1 + component2]
  // Only process if brackets come AFTER a word (not before it on the line)
  // Pattern: word (with possible hyphen) followed by space, then brackets
  const breakdownPattern = /(\S+)\s+\[([^\]]+)\](?:\s*\(\d+\))?/g;
  const breakdowns = new Map<string, string[]>(); // Map from word to components

  let processedLine = line;
  const matches = Array.from(line.matchAll(breakdownPattern));

  for (const match of matches) {
    const fullMatch = match[0]; // e.g., "महाबुद्धिर्महासिद्धिर्महायोगेश्वरेश्वरी [महाबुद्धिः + महासिद्धिः + महायोगेश्वरेश्वरी](55)"
    const wordBeforeBrackets = match[1]; // e.g., "महाबुद्धिर्महासिद्धिर्महायोगेश्वरेश्वरी" or "चितिस्तत्पद-लक्ष्यार्था"
    const componentsStr = match[2]; // e.g., "महाबुद्धिः + महासिद्धिः + महायोगेश्वरेश्वरी"

    if (!fullMatch || !wordBeforeBrackets || !componentsStr) continue;

    // Clean the word (remove trailing punctuation like ।)
    const word = wordBeforeBrackets.replace(/[।॥]*$/, "");
    if (word) {
      const components = componentsStr
        .split(/\s*\+\s*/)
        .map((c) => c.trim())
        .filter(Boolean);
      breakdowns.set(word, components);
    }

    // Remove the breakdown pattern from the line (keep the word, remove brackets and number)
    processedLine = processedLine.replace(fullMatch, wordBeforeBrackets);
  }

  // Split by verse numbers (॥ १॥ etc) to preserve them
  const parts = processedLine.split(/(॥\s*[०-९\d]+\s*॥)/);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part || !part.trim()) continue;

    // If it's a verse number, add as non-clickable
    if (/॥\s*[०-९\d]+\s*॥/.test(part)) {
      result.push({ word: part, isWord: false });
      continue;
    }

    // Split by spaces to get words (dashes within words are preserved)
    const words = part.split(/\s+/).filter((w) => w && w.trim());

    // Track whether we are inside parens — words inside (...) are alternate readings,
    // not actual verse words, so they should render as non-clickable text.
    let parenDepth = 0;

    for (let j = 0; j < words.length; j++) {
      const word = words[j];
      if (!word) continue;

      const opens = (word.match(/\(/g) ?? []).length;
      const closes = (word.match(/\)/g) ?? []).length;
      const wasInsideParens = parenDepth > 0;
      parenDepth += opens - closes;
      if (parenDepth < 0) parenDepth = 0;
      const insideParens =
        wasInsideParens || opens > 0 || word.includes(")");

      if (insideParens) {
        result.push({ word, isWord: false });
        if (j < words.length - 1) {
          result.push({ word: " ", isWord: false });
        }
        continue;
      }

      // Remove trailing punctuation like । but keep it separate
      const match = word.match(/^(.+?)([।]*)$/);
      if (match) {
        const mainWord = match[1];
        const punctuation = match[2];

        if (mainWord && mainWord.length >= 1) {
          // Check if this word has breakdown components
          const components = breakdowns.get(mainWord);
          if (components) {
            result.push({
              word: mainWord,
              isWord: true,
              breakdownComponents: components,
            });
          } else {
            result.push({ word: mainWord, isWord: true });
          }
        }

        if (punctuation) {
          result.push({ word: punctuation, isWord: false });
        }
      }

      // Add space between words (except after last word in part)
      if (j < words.length - 1) {
        result.push({ word: " ", isWord: false });
      }
    }
  }

  return result;
}

/**
 * Normalize Devanagari for fuzzy matching across commentary sources.
 * Folds away spelling variations that don't change the underlying name:
 *   - long/short u (रू ↔ रु)
 *   - long/short i (ी ↔ ि) at end
 *   - anusvāra forms (ंक ↔ ङ्क, ंग ↔ ङ्ग, ंच ↔ ञ्च, ंत ↔ न्त, ंप ↔ म्प, ंब ↔ म्ब)
 *   - dashes, whitespace, avagraha
 */
function normalizeName(name: string): string {
  return name
    .replace(/-/g, "")
    .replace(/\s+/g, "")
    .replace(/ऽ/g, "")
    // Fold long↔short vowel pairs to absorb common spelling variations
    .replace(/ा/g, "")
    .replace(/ू/g, "ु")
    .replace(/ी/g, "ि")
    .replace(/ै/g, "े")
    .replace(/ौ/g, "ो")
    .replace(/आ/g, "अ")
    .replace(/ऊ/g, "उ")
    .replace(/ई/g, "इ")
    .replace(/ऐ/g, "ए")
    .replace(/औ/g, "ओ")
    .replace(/ङ्क/g, "ंक")
    .replace(/ङ्ख/g, "ंख")
    .replace(/ङ्ग/g, "ंग")
    .replace(/ङ्घ/g, "ंघ")
    .replace(/ञ्च/g, "ंच")
    .replace(/ञ्ज/g, "ंज")
    .replace(/ण्ट/g, "ंट")
    .replace(/ण्ठ/g, "ंठ")
    .replace(/ण्ड/g, "ंड")
    .replace(/ण्ढ/g, "ंढ")
    .replace(/न्त/g, "ंत")
    .replace(/न्द/g, "ंद")
    .replace(/न्ध/g, "ंध")
    .replace(/म्प/g, "ंप")
    .replace(/म्फ/g, "ंफ")
    .replace(/म्ब/g, "ंब")
    .replace(/म्भ/g, "ंभ");
}

// Build a normalized-key cache lazily per commentary source so we only compute
// the index once per source per render rather than re-walking every lookup.
const normalizedSourceCache = new WeakMap<
  Record<string, string>,
  Map<string, string>
>();

function getNormalizedIndex(
  source: Record<string, string>,
): Map<string, string> {
  let index = normalizedSourceCache.get(source);
  if (!index) {
    index = new Map();
    for (const key of Object.keys(source)) {
      index.set(normalizeName(key), key);
    }
    normalizedSourceCache.set(source, index);
  }
  return index;
}

/**
 * Find commentary for a name from a specific commentary source, trying with and without dashes, and handling avagraha
 */
function findCommentary(
  name: string,
  commentarySource: Record<string, string>,
): string | null {
  // Special case for ॐ (om)
  if (name === "ॐ" || name === "ओं") {
    return "The primordial Sound";
  }

  // Try exact match first
  const exact = commentarySource[name];
  if (exact) {
    return exact;
  }

  // Most commentary keys are stored without dashes, so use the dash-stripped form
  // for the remaining heuristics (avagraha split, sandhi split, fuzzy match, etc).
  const dashless = name.replace(/-/g, "");
  if (dashless !== name) {
    const dashlessHit = commentarySource[dashless];
    if (dashlessHit) return dashlessHit;
  }
  name = dashless;

  // Try replacing avagraha (ऽ) with 'अ' - handles cases like "सर्वारुणाऽनवद्याङ्गी"
  if (name.includes("ऽ")) {
    const nameWithA = name.replace(/ऽ+/g, "अ");
    if (commentarySource[nameWithA]) {
      return commentarySource[nameWithA];
    }

    // Split on avagraha sequences and try to assemble matching component commentaries.
    // In Sanskrit transcription, a single avagraha (ऽ) marks an elided "अ" and a
    // double avagraha (ऽऽ) marks an elided "आ" on the following piece.
    const splitParts: Array<{ text: string; elided: string }> = [];
    let cursor = 0;
    let pendingElided = "";
    while (cursor < name.length) {
      const nextAvagraha = name.indexOf("ऽ", cursor);
      if (nextAvagraha === -1) {
        const tail = name.slice(cursor);
        if (tail) splitParts.push({ text: tail, elided: pendingElided });
        break;
      }
      const chunk = name.slice(cursor, nextAvagraha);
      if (chunk || pendingElided) {
        splitParts.push({ text: chunk, elided: pendingElided });
      }
      let count = 0;
      cursor = nextAvagraha;
      while (name[cursor] === "ऽ") {
        count++;
        cursor++;
      }
      pendingElided = count >= 2 ? "आ" : "अ";
    }
    if (splitParts.length >= 2) {
      const entries: Array<{ key: string; text: string }> = [];
      let succeeded = true;
      for (let p = 0; p < splitParts.length; p++) {
        const { text, elided } = splitParts[p]!;
        const candidates = elided ? [elided + text, text] : [text];
        let matched: Array<{ key: string; text: string }> | null = null;
        for (const c of candidates) {
          const resolved = resolveCandidate(c, commentarySource);
          if (resolved) {
            matched = "single" in resolved ? [resolved.single] : resolved.multi;
            break;
          }
        }
        if (!matched) {
          succeeded = false;
          break;
        }
        entries.push(...matched);
      }
      if (succeeded && entries.length > 0) {
        return entries
          .map(({ key, text }) => `${key}\n${text}`)
          .join("\n\n");
      }
    }
  }

  // Try matching by removing dashes from existing keys (since name is already dashless)
  for (const key in commentarySource) {
    if (key.replace(/-/g, "") === name) {
      return commentarySource[key] ?? null;
    }
  }

  // Fuzzy match via Devanagari normalization (anusvāra forms, long/short vowels, avagraha)
  const normalizedIndex = getNormalizedIndex(commentarySource);
  const normalized = normalizeName(name);
  const fuzzyKey = normalizedIndex.get(normalized);
  if (fuzzyKey) {
    return commentarySource[fuzzyKey] ?? null;
  }

  // Sandhi split: names joined by र् (e.g., निरुपाधिर्निरीश्वरा = निरुपाधिः + निरीश्वरा,
  // महाशक्तिर्महारतिः = महाशक्तिः + महारतिः). Split at र्, replace र् with ः on the
  // left half, and combine matching commentaries.
  const sandhiParts = trySandhiSplit(name, commentarySource);
  if (sandhiParts) {
    return sandhiParts
      .map(({ key, text }) => `${key}\n${text}`)
      .join("\n\n");
  }

  return null;
}

/**
 * Attempt to split a sandhi-joined name into known component names.
 * Splits on र् (re-adding ः to the left half) and recursively splits the right half.
 * Returns null unless every resulting component is found in the commentary source.
 */
/**
 * Resolve a single name candidate against a commentary source. Returns the
 * matched key and its text — using exact match, fuzzy-normalized match, and
 * (recursively) sandhi splits. Used inside avagraha + sandhi heuristics so they
 * can compose with one another.
 */
function resolveCandidate(
  candidate: string,
  src: Record<string, string>,
):
  | { single: { key: string; text: string } }
  | { multi: Array<{ key: string; text: string }> }
  | null {
  if (src[candidate]) return { single: { key: candidate, text: src[candidate]! } };
  const idx = getNormalizedIndex(src);
  const fuzzy = idx.get(normalizeName(candidate));
  if (fuzzy) return { single: { key: fuzzy, text: src[fuzzy]! } };
  const sandhi = trySandhiSplit(candidate, src);
  if (sandhi) return { multi: sandhi };
  return null;
}

function trySandhiSplit(
  name: string,
  commentarySource: Record<string, string>,
): Array<{ key: string; text: string }> | null {
  const tryWithLeftAndRest = (
    left: string,
    rest: string,
  ): Array<{ key: string; text: string }> | null => {
    // Left must resolve to a single known name (not itself a sandhi composite),
    // to avoid runaway recursion across the whole word.
    const leftKey = commentarySource[left]
      ? left
      : (getNormalizedIndex(commentarySource).get(normalizeName(left)) ?? null);
    if (!leftKey) return null;
    const leftText = commentarySource[leftKey]!;

    const restResolved = resolveCandidate(rest, commentarySource);
    if (!restResolved) return null;
    if ("single" in restResolved) {
      return [{ key: leftKey, text: leftText }, restResolved.single];
    }
    return [{ key: leftKey, text: leftText }, ...restResolved.multi];
  };

  const independentVowels = "अआइईउऊऋॠएऐओऔ";
  const consonants = "कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळक्षज्ञ";
  // Vowel signs (matras) → corresponding independent vowel for restoring the
  // right-hand component after sandhi (e.g. कीर्तिः + उद्दाम → कीर्तिरुद्दाम,
  // where the independent उ became the matra ु on र).
  const matraToIndependent: Record<string, string> = {
    "ा": "आ", "ि": "इ", "ी": "ई", "ु": "उ", "ू": "ऊ",
    "ृ": "ऋ", "ॄ": "ॠ", "े": "ए", "ै": "ऐ", "ो": "ओ", "ौ": "औ",
  };

  for (let i = 1; i < name.length - 1; i++) {
    // Case 1: ः + consonant-cluster → र् + consonant
    //   (e.g. निरुपाधिः + निरीश्वरा → निरुपाधिर्निरीश्वरा)
    if (name[i] === "्" && name[i - 1] === "र") {
      const split = tryWithLeftAndRest(
        name.slice(0, i - 1) + "ः",
        name.slice(i + 1),
      );
      if (split) return split;
    }
    // Case 2: ः + independent vowel → र + vowel
    //   (e.g. आदिशक्तिः + अमेया → आदिशक्तिरमेया [vowel kept on right])
    if (name[i] === "र" && independentVowels.includes(name[i + 1] ?? "")) {
      const split = tryWithLeftAndRest(
        name.slice(0, i) + "ः",
        name.slice(i + 1),
      );
      if (split) return split;
    }
    // Case 3: ः + अ (inherent vowel) → र + consonant
    //   The right word starts with अ that was absorbed into the consonant's
    //   inherent vowel after sandhi. e.g. स्मृतिः + अनुत्तमा → स्मृतिरनुत्तमा.
    //   Detect: a bare र (not followed by virama and not part of a cluster)
    //   followed by a consonant — try prepending अ to the right half.
    if (
      name[i] === "र" &&
      name[i + 1] !== "्" &&
      consonants.includes(name[i + 1] ?? "") &&
      name[i - 1] !== "्"
    ) {
      const split = tryWithLeftAndRest(
        name.slice(0, i) + "ः",
        "अ" + name.slice(i + 1),
      );
      if (split) return split;
    }
    // Case 4: ः + vowel (other than अ) → र + matra
    //   e.g. कीर्तिः + उद्दामवैभवा → कीर्तिरुद्दामवैभवा (उ became the matra ु on र).
    //   Detect: a bare र followed by a vowel sign — restore that matra as an
    //   independent vowel on the right half.
    {
      const matra = name[i + 1];
      if (
        name[i] === "र" &&
        matra &&
        matra in matraToIndependent &&
        name[i - 1] !== "्"
      ) {
        const split = tryWithLeftAndRest(
          name.slice(0, i) + "ः",
          matraToIndependent[matra]! + name.slice(i + 2),
        );
        if (split) return split;
      }
    }
    // Case 5: ः + voiceless stop → sibilant + same stop
    //   e.g. त्रिमूर्तिः + त्रिदशेश्वरी → त्रिमूर्तिस्त्रिदशेश्वरी (ः + त → स्त).
    //   Detect a sibilant (स/श/ष) followed by virama followed by a stop,
    //   sitting between vowel-bearing context on the left.
    if (
      (name[i] === "स" || name[i] === "श" || name[i] === "ष") &&
      name[i + 1] === "्" &&
      name[i + 2] &&
      consonants.includes(name[i + 2]!) &&
      i > 0 &&
      name[i - 1] !== "्"
    ) {
      const split = tryWithLeftAndRest(
        name.slice(0, i) + "ः",
        name.slice(i + 2),
      );
      if (split) return split;
    }
  }
  return null;
}

/**
 * Parse root breakdown text format:
 * Line 1: top-level split with underscores (e.g., "श्री_माता")
 * Lines 2+: "word -> meaning [√root]" or "word -> sub1_sub2" (further split)
 */
function parseRootText(text: string) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return null;

  const topLevel = lines[0]!.trim();
  const lookup = new Map<string, string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const arrowIdx = line.indexOf(" -> ");
    if (arrowIdx !== -1) {
      const key = line.substring(0, arrowIdx).trim();
      const value = line.substring(arrowIdx + 4).trim();
      lookup.set(key, value);
    }
  }

  return { topLevel, lookup };
}

function RootBreakdown({ text }: { text: string }) {
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [focusedPart, setFocusedPart] = useState<string | null>(null);

  const parsed = useMemo(() => parseRootText(text), [text]);

  // Reset focus when the breakdown text changes (new word opened).
  useEffect(() => {
    setDrillPath([]);
    setFocusedPart(null);
  }, [text]);

  if (!parsed) return <p className="text-[#5a3a18]">{text}</p>;

  const { topLevel, lookup } = parsed;

  // Determine current split string based on drill path
  let currentSplit: string;
  if (drillPath.length === 0) {
    currentSplit = topLevel;
  } else {
    const lastWord = drillPath[drillPath.length - 1]!;
    currentSplit = lookup.get(lastWord) || topLevel;
  }

  const parts = currentSplit.split("_");

  const handlePartClick = (part: string) => {
    const breakdown = lookup.get(part);
    if (breakdown && breakdown.includes("_")) {
      setDrillPath([...drillPath, part]);
      setFocusedPart(null);
    } else {
      setFocusedPart((cur) => (cur === part ? null : part));
    }
  };

  // Walk a compound part down to its leaf glosses. Returns the leaves in the
  // order they appear in the breakdown so they read like the source name.
  const flattenToLeaves = (
    part: string,
  ): Array<{ part: string; meaning: string; root: string | null }> => {
    const breakdown = lookup.get(part);
    if (!breakdown) return [];
    if (!breakdown.includes("_")) {
      const rootMatch = breakdown.match(/\[(.+?)\]$/);
      return [
        {
          part,
          meaning: rootMatch
            ? breakdown.replace(/\s*\[.+?\]$/, "").trim()
            : breakdown,
          root: rootMatch?.[1] ?? null,
        },
      ];
    }
    return breakdown.split("_").flatMap((p) => flattenToLeaves(p));
  };

  const renderMeaning = (part: string, key: React.Key) => {
    const breakdown = lookup.get(part);
    if (!breakdown) return null;
    const isCompound = breakdown.includes("_");
    const isFocused = focusedPart === part;

    if (isCompound) {
      // Show the compound's leaf glosses inline so the user sees meanings
      // without having to drill in. Drill-down still works via the chip.
      const leaves = flattenToLeaves(part);
      if (leaves.length === 0) return null;

      return (
        <div
          key={key}
          className={`rounded-md border border-[#c2410c]/25 bg-[#fff3d6]/40 px-3 py-2 text-sm transition-colors ${
            isFocused ? "bg-[#fde68a]/60" : ""
          }`}
        >
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span
              className={`font-sanskrit ${
                isFocused
                  ? "font-semibold text-[#7c1d1d]"
                  : "font-semibold text-[#c2410c]"
              }`}
            >
              {part}
            </span>
            <span className="font-sanskrit text-xs text-[#8a6a3c]">
              = {breakdown.replace(/_/g, " + ")}
            </span>
          </div>
          <div className="mt-1.5 space-y-1.5">
            {leaves.map((leaf, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-baseline gap-x-2 pl-3"
              >
                <span className="font-sanskrit text-[#c2410c]/85">
                  {leaf.part}
                </span>
                {leaf.root && (
                  <span className="font-sanskrit text-xs text-[#8a6a3c]">
                    {leaf.root}
                  </span>
                )}
                <span className="text-[#5a3a18]">{leaf.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Leaf: "meaning1 + meaning2 [√root]"
    const rootMatch = breakdown.match(/\[(.+?)\]$/);
    const meaningText = rootMatch
      ? breakdown.replace(/\s*\[.+?\]$/, "").trim()
      : breakdown;
    const root = rootMatch ? rootMatch[1] : null;

    return (
      <div
        key={key}
        className={`rounded-md text-sm transition-colors ${
          isFocused
            ? "border border-[#c2410c]/40 bg-[#fde68a]/60 px-3 py-2"
            : "px-1 py-1"
        }`}
      >
        <div className="flex items-baseline gap-2">
          <span
            className={`font-sanskrit shrink-0 ${
              isFocused
                ? "font-semibold text-[#7c1d1d]"
                : "text-[#c2410c]"
            }`}
          >
            {part}
          </span>
          {root && (
            <span className="shrink-0 text-xs text-[#8a6a3c]">{root}</span>
          )}
        </div>
        <p
          className={`mt-0.5 ${
            isFocused ? "text-[#2b1700]" : "text-[#5a3a18]"
          }`}
        >
          {meaningText}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      {drillPath.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button
            onClick={() => {
              setDrillPath([]);
              setFocusedPart(null);
            }}
            className="font-sanskrit text-[#8a6a3c] hover:text-[#c2410c]"
          >
            {topLevel.replace(/_/g, " · ")}
          </button>
          {drillPath.map((p, i) => (
            <React.Fragment key={i}>
              <span className="text-[#8a6a3c]/60">›</span>
              <button
                onClick={() => {
                  setDrillPath(drillPath.slice(0, i + 1));
                  setFocusedPart(null);
                }}
                className={`font-sanskrit ${
                  i === drillPath.length - 1
                    ? "font-semibold text-[#c2410c]"
                    : "text-[#8a6a3c] hover:text-[#c2410c]"
                }`}
              >
                {p}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Split parts as clickable chips — every chip is interactive */}
      <div className="flex flex-wrap gap-2">
        {parts.map((part, i) => {
          const breakdown = lookup.get(part);
          const hasChildren = breakdown ? breakdown.includes("_") : false;
          const isFocused = focusedPart === part;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePartClick(part)}
              className={`font-sanskrit sticker-chip text-base ${
                hasChildren
                  ? "sticker-chip--compound"
                  : isFocused
                    ? "sticker-chip--focused"
                    : ""
              }`}
            >
              {part}
              {hasChildren && <span className="text-xs">▸</span>}
            </button>
          );
        })}
      </div>

      {/* Meanings: focused chip first, then the rest of the leaves */}
      <div className="space-y-2 pt-1">
        {focusedPart && renderMeaning(focusedPart, "focused")}
        {parts
          .filter((part) => part !== focusedPart)
          .map((part, i) => renderMeaning(part, `leaf-${i}`))}
      </div>
    </div>
  );
}

function WordPopover({
  word,
  wordId,
  commentariesBySource,
  isOpen,
  onOpenChange,
  onNext,
  shouldScroll,
  preferredTab,
  onTabChange,
}: {
  word: string;
  wordId: string;
  commentariesBySource: Record<string, string>; // commentary name -> commentary text
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNext: () => void;
  shouldScroll: boolean;
  preferredTab: string | null;
  onTabChange: (tabName: string) => void;
}) {
  // Format tab name for display (capitalize first letter, handle special cases)
  const formatTabName = (tabName: string): string => {
    if (tabName === "root") return "*";
    return tabName;
  };

  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    axis: "x",
  });

  // Initialize selected tab based on preference or first available
  useEffect(() => {
    if (isOpen) {
      const availableTabs = Object.keys(commentariesBySource)
        .filter(
          (key) =>
            commentariesBySource[key] !== null &&
            commentariesBySource[key] !== undefined,
        )
        .sort((a, b) => {
          // Ensure "root" appears first
          if (a === "root") return -1;
          if (b === "root") return 1;
          return 0; // Keep original order for others
        });

      if (availableTabs.length > 0) {
        // Use preferred tab if it exists for this word, otherwise use first available
        const tabToUse =
          preferredTab && availableTabs.includes(preferredTab)
            ? preferredTab
            : availableTabs[0];

        if (tabToUse) {
          setSelectedTab(tabToUse);
        }
      }
    }
  }, [isOpen, commentariesBySource, preferredTab]);

  // Get available tabs, ensuring "root" appears first
  const availableTabs = Object.keys(commentariesBySource)
    .filter(
      (key) =>
        commentariesBySource[key] !== null &&
        commentariesBySource[key] !== undefined,
    )
    .sort((a, b) => {
      // Ensure "root" appears first
      if (a === "root") return -1;
      if (b === "root") return 1;
      return 0; // Keep original order for others
    });

  // Reinitialize carousel when popover opens or tabs change
  useEffect(() => {
    if (isOpen && emblaApi && availableTabs.length > 0) {
      emblaApi.reInit();
    }
  }, [isOpen, emblaApi, availableTabs.length]);

  // Sync embla carousel with selected tab
  useEffect(() => {
    if (!emblaApi || !selectedTab) return;

    const tabIndex = availableTabs.indexOf(selectedTab);
    if (tabIndex !== -1 && emblaApi.selectedScrollSnap() !== tabIndex) {
      emblaApi.scrollTo(tabIndex);
    }
  }, [selectedTab, emblaApi, availableTabs]);

  // Sync selected tab with embla carousel
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const selectedIndex = emblaApi.selectedScrollSnap();
    const newTab = availableTabs[selectedIndex];
    if (newTab && newTab !== selectedTab) {
      setSelectedTab(newTab);
      onTabChange(newTab);
    }
  }, [emblaApi, availableTabs, selectedTab, onTabChange]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Handle tab selection and update preference
  const handleTabClick = (tabName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTab(tabName);
    onTabChange(tabName);
  };

  const triggerRef = useRef<HTMLSpanElement>(null);

  // Scroll to word only when navigating from another word (not initial click)
  useEffect(() => {
    if (isOpen && shouldScroll && triggerRef.current) {
      triggerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isOpen, shouldScroll]);

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span
          ref={triggerRef}
          id={wordId}
          className="cursor-pointer underline decoration-[#c2410c]/50 decoration-dotted underline-offset-2 transition-colors hover:text-[#c2410c]"
        >
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="paper-popover z-50 flex max-h-[480px] w-[22rem] max-w-[92vw] flex-col p-0"
      >
        <div className="flex-shrink-0 space-y-3 px-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <span className="number-pill mt-1.5">NĀMA</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              aria-label="Close"
              className="text-[#8a6a3c] hover:text-[#2b1700]"
            >
              <span aria-hidden className="text-xl leading-none">×</span>
            </button>
          </div>

          <h3
            className="font-sanskrit cursor-pointer text-2xl font-extrabold leading-tight text-[#2b1700] hover:text-[#c2410c]"
            onClick={(e) => {
              e.stopPropagation();
              if (availableTabs.includes("root") && selectedTab !== "root") {
                handleTabClick("root", e);
              }
            }}
            title={
              availableTabs.includes("root")
                ? "Show root breakdown"
                : undefined
            }
          >
            {word}
          </h3>

          {/* Tabs as pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {availableTabs.map((tabName) => {
              const isSelected = selectedTab === tabName;
              return (
                <button
                  key={tabName}
                  onClick={(e) => handleTabClick(tabName, e)}
                  className={`pill-tab ${
                    isSelected
                      ? tabName === "root"
                        ? "pill-tab--saffron"
                        : "pill-tab--active"
                      : ""
                  }`}
                >
                  {formatTabName(tabName)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Carousel */}
        <div
          className="min-h-0 flex-1 overflow-x-hidden px-5 pt-2"
          ref={emblaRef}
          style={{ height: "calc(480px - 200px)" }}
        >
          <div className="flex h-full">
            {availableTabs.map((tabName) => {
              const commentary = commentariesBySource[tabName];
              if (!commentary) return null;

              return (
                <div
                  key={tabName}
                  className="h-full min-w-0 flex-[0_0_100%]"
                  style={{ minHeight: 0 }}
                >
                  <div
                    className="scrollbar-hide h-full overflow-y-auto px-1"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    <div className="space-y-3 py-0 text-sm leading-relaxed text-[#2b1700]/85">
                      {tabName === "root" ? (
                        <RootBreakdown text={commentary} />
                      ) : commentary.includes("\n\n") ? (
                        // Multiple components: each has Sanskrit name and meaning
                        commentary.split("\n\n").map((component, idx) => {
                          const lines = component.split("\n");
                          const sanskritName = lines[0];
                          const meaning = lines.slice(1).join(" ");
                          return (
                            <div
                              key={idx}
                              className={
                                idx > 0
                                  ? "border-t border-dashed border-[#2b1700]/15 pt-2"
                                  : ""
                              }
                            >
                              <p className="font-sanskrit mb-1 text-base font-bold text-[#7c1d1d]">
                                {sanskritName}
                              </p>
                              <p className="text-[#2b1700]">{meaning}</p>
                            </div>
                          );
                        })
                      ) : commentary.includes("\n") ? (
                        // Commentary with newlines - render each line separately
                        commentary.split("\n").map((line, idx) => (
                          <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                            {line}
                          </p>
                        ))
                      ) : (
                        // Single meaning (regular word)
                        <p>{commentary}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex flex-shrink-0 items-center justify-between gap-3 border-t-2 border-dashed border-[#2b1700]/20 px-5 py-3">
          <p className="text-[10px] font-bold tracking-widest text-[#8a6a3c] uppercase">
            tap a part ↑
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="btn-saffron inline-flex items-center gap-1 text-xs"
          >
            Next nāma →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function VersesDisplay({
  sanskritText,
  commentaries,
}: VersesDisplayProps) {
  const lines = sanskritText.split("\n");
  const [openWordId, setOpenWordId] = useState<string | null>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [preferredCommentaryTab, setPreferredCommentaryTab] = useState<
    string | null
  >(null);

  // Create a map of wordId -> commentaries by matching words to commentary names
  const wordToCommentaryMap = new Map<
    string,
    {
      word: string;
      commentariesBySource: Record<string, string>;
      breakdownComponents?: string[];
    }
  >();

  // Pattern to detect concluding line (should not be processed for word matching)
  const concludingLinePattern =
    /एवं\s+श्रीललिता\s+देव्या\s+नाम्नां\s+साहस्रकं\s+जगुः/;

  lines.forEach((line, lineIndex) => {
    if (!line.trim()) return;
    // Skip the concluding line for word matching
    if (concludingLinePattern.test(line)) return;

    const parsed = parseWordsFromLine(line);
    parsed.forEach((item, wordIndex) => {
      if (item.isWord) {
        const wordId = `word-${lineIndex}-${wordIndex}`;

        // Collect commentaries from all sources for this word
        const commentariesBySource: Record<string, string> = {};
        let hasAnyCommentary = false;

        // If word has breakdown components, combine their commentaries with Sanskrit names
        if (item.breakdownComponents && item.breakdownComponents.length > 0) {
          // Process each commentary source
          for (const [sourceName, sourceCommentaries] of Object.entries(
            commentaries,
          )) {
            const componentEntries: Array<{
              sanskrit: string;
              meaning: string;
            }> = [];
            for (const component of item.breakdownComponents) {
              const compCommentary = findCommentary(
                component,
                sourceCommentaries,
              );
              if (compCommentary) {
                componentEntries.push({
                  sanskrit: component,
                  meaning: compCommentary,
                });
              }
            }

            if (componentEntries.length > 0) {
              // Format: Sanskrit name on one line, meaning below, with blank line between components
              const combinedCommentary = componentEntries
                .map((entry) => `${entry.sanskrit}\n${entry.meaning}`)
                .join("\n\n");
              commentariesBySource[sourceName] = combinedCommentary;
              hasAnyCommentary = true;
            }
          }

          if (hasAnyCommentary) {
            wordToCommentaryMap.set(wordId, {
              word: item.word,
              commentariesBySource,
              breakdownComponents: item.breakdownComponents,
            });
          }
        } else {
          // Regular word lookup - check all commentary sources
          for (const [sourceName, sourceCommentaries] of Object.entries(
            commentaries,
          )) {
            const commentary = findCommentary(item.word, sourceCommentaries);
            if (commentary) {
              commentariesBySource[sourceName] = commentary;
              hasAnyCommentary = true;
            }
          }

          if (hasAnyCommentary) {
            wordToCommentaryMap.set(wordId, {
              word: item.word,
              commentariesBySource,
            });
          }
        }
      }
    });
  });

  // Collect all words with commentaries for cycling functionality
  const wordsWithCommentaries: WordWithCommentary[] = [];
  wordToCommentaryMap.forEach((value, wordId) => {
    const [lineIndex, wordIndex] = wordId
      .replace("word-", "")
      .split("-")
      .map(Number);
    wordsWithCommentaries.push({
      id: wordId,
      word: value.word,
      lineIndex: lineIndex ?? 0,
      wordIndex: wordIndex ?? 0,
      commentariesBySource: value.commentariesBySource,
      breakdownComponents: value.breakdownComponents,
    });
  });

  const currentWordIndex = wordsWithCommentaries.findIndex(
    (w) => w.id === openWordId,
  );

  const handleNextWord = () => {
    if (wordsWithCommentaries.length === 0) return;

    const nextIndex =
      currentWordIndex >= 0
        ? (currentWordIndex + 1) % wordsWithCommentaries.length
        : 0;

    const nextWord = wordsWithCommentaries[nextIndex];
    if (nextWord) {
      setShouldScroll(true); // Enable scrolling when navigating to next word
      setOpenWordId(nextWord.id);
    }
  };

  const handleWordOpenChange = (wordId: string, open: boolean) => {
    if (open && openWordId !== null && openWordId !== wordId) {
      // Opening a different word (navigation), enable scrolling
      setShouldScroll(true);
    } else if (open && openWordId === null) {
      // Initial click, disable scrolling
      setShouldScroll(false);
    }
    setOpenWordId(open ? wordId : null);
  };

  // Separate regular lines from concluding line
  const regularLines: string[] = [];
  let concludingLine: string | null = null;

  lines.forEach((line) => {
    if (concludingLinePattern.test(line)) {
      concludingLine = line;
    } else {
      regularLines.push(line);
    }
  });

  return (
    <div className="font-sanskrit mx-auto max-w-3xl text-left text-lg leading-relaxed">
      {/* Render regular verses */}
      {regularLines.map((line: string, lineIndex: number) => {
        // Handle empty lines - add more spacing between verses
        if (!line.trim()) {
          return <p key={lineIndex} className="mb-6" />;
        }

        // Parse the line into words and punctuation
        const parsed = parseWordsFromLine(line);

        // Check if this line contains a verse number (॥)
        const hasVerseNumber = /॥\s*[०-९\d]+\s*॥/.test(line);

        // Add more margin after verse numbers to create space between verses
        const marginClass = hasVerseNumber ? "mb-8" : "mb-2";

        return (
          <p key={lineIndex} className={marginClass}>
            {parsed.map((item, wordIndex) => {
              if (item.isWord) {
                const wordId = `word-${lineIndex}-${wordIndex}`;
                // Find commentary by name matching using the map
                const wordEntry = wordToCommentaryMap.get(wordId);

                if (wordEntry) {
                  return (
                    <WordPopover
                      key={`${lineIndex}-${wordIndex}`}
                      word={wordEntry.word}
                      wordId={wordId}
                      commentariesBySource={wordEntry.commentariesBySource}
                      isOpen={openWordId === wordId}
                      onOpenChange={(open) => {
                        handleWordOpenChange(wordId, open);
                      }}
                      onNext={handleNextWord}
                      shouldScroll={shouldScroll && openWordId === wordId}
                      preferredTab={preferredCommentaryTab}
                      onTabChange={setPreferredCommentaryTab}
                    />
                  );
                }
                // No commentary, render as normal text
                return (
                  <span key={`${lineIndex}-${wordIndex}`}>{item.word}</span>
                );
              }
              return <span key={`${lineIndex}-${wordIndex}`}>{item.word}</span>;
            })}
          </p>
        );
      })}

      {/* Render concluding line at the end with special styling */}
      {concludingLine && (
        <div className="mt-12 border-t border-yellow-600/30 pt-8">
          <p className="text-center text-xl font-semibold text-yellow-200">
            {concludingLine}
          </p>
        </div>
      )}
    </div>
  );
}
