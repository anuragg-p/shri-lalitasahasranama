/**
 * SM-2 spaced repetition scheduler (Anki's classic algorithm).
 *
 * Quality scale (Anki-style, mapped from the four buttons we show):
 *   0  = Again (forgot; lapse — reset interval, drop ease)
 *   3  = Hard  (correct with great effort — small interval bump, drop ease slightly)
 *   4  = Good  (correct with some effort — normal interval bump, ease unchanged)
 *   5  = Easy  (trivially correct — bigger interval bump, raise ease)
 *
 * Evidence: Roediger & Karpicke 2006 (testing effect); Ebbinghaus 1885,
 * Cepeda 2008 (distributed practice). SM-2 codifies the spacing function.
 */

export type Mode = "numberToNama" | "namaToMeaning" | "previousToNext";

export const ALL_MODES: Mode[] = [
  "numberToNama",
  "namaToMeaning",
  "previousToNext",
];

export const MODE_LABELS: Record<Mode, string> = {
  numberToNama: "Number → Nāma",
  namaToMeaning: "Nāma → Meaning",
  previousToNext: "Previous → Next",
};

export type Quality = 0 | 3 | 4 | 5;

export type Card = {
  mode: Mode;
  /** nāma number (1..1000) that the PROMPT references. */
  nama: number;
  /** Ease factor (Anki default 2.5; floor 1.3). */
  ef: number;
  /** Current interval in days. */
  interval: number;
  /** Number of successful reps since the last lapse. */
  reps: number;
  /** Total lapses over the card's lifetime. */
  lapses: number;
  /** ISO date string (YYYY-MM-DD) when this card next becomes due. */
  due: string;
  /** ISO date string of last review, if any. */
  lastReview?: string;
};

export type CardKey = `${Mode}:${number}`;

export function cardKey(mode: Mode, nama: number): CardKey {
  return `${mode}:${nama}`;
}

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + Math.max(1, days));
  return todayIso(d);
}

/** A fresh card — eligible to be introduced as "new" today. */
export function createCard(mode: Mode, nama: number, now: Date = new Date()): Card {
  return {
    mode,
    nama,
    ef: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    due: todayIso(now),
  };
}

/** Apply a single review with the given quality rating. Returns a new Card. */
export function review(card: Card, quality: Quality, now: Date = new Date()): Card {
  const today = todayIso(now);

  if (quality < 3) {
    // Lapse: reset to short re-learning interval, drop ease.
    return {
      ...card,
      reps: 0,
      interval: 1,
      lapses: card.lapses + 1,
      ef: Math.max(1.3, card.ef - 0.2),
      due: addDays(today, 1),
      lastReview: today,
    };
  }

  // Update ease factor per SM-2:
  //   ef' = ef + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
  const q = quality;
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const newEf = Math.max(1.3, card.ef + delta);

  // Update interval:
  let newInterval: number;
  const reps = card.reps + 1;
  if (reps === 1) {
    newInterval = 1;
  } else if (reps === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.max(1, Math.ceil(card.interval * newEf));
  }

  return {
    ...card,
    reps,
    interval: newInterval,
    ef: newEf,
    due: addDays(today, newInterval),
    lastReview: today,
  };
}

export function isDue(card: Card, now: Date = new Date()): boolean {
  return card.due <= todayIso(now);
}

export function isNew(card: Card): boolean {
  return card.reps === 0 && card.lapses === 0;
}

/** Whether this nāma is a valid prompt for the given mode. */
export function isValidNama(mode: Mode, nama: number): boolean {
  if (mode === "previousToNext") return nama >= 1 && nama <= 999;
  return nama >= 1 && nama <= 1000;
}
