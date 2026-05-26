import {
  type Card,
  type CardKey,
  type Mode,
  ALL_MODES,
  cardKey,
  createCard,
  isDue,
  isNew,
  isValidNama,
  review,
  todayIso,
  type Quality,
} from "./srs";

const STORAGE_KEY = "lsn-srs-v1";

export type Settings = {
  modes: Mode[];
  /** New cards introduced per day (across all enabled modes). */
  dailyNew: number;
  /** Cap on total reviews per session. */
  dailyMaxReviews: number;
};

export type Stats = {
  totalReviews: number;
  totalLapses: number;
  streakDays: number;
  lastSessionDate?: string;
  /** Reviews completed today (for the streak / daily cap). */
  reviewsToday: number;
  /** Date the reviewsToday counter applies to. */
  reviewsTodayDate: string;
  /** New cards introduced today. */
  newToday: number;
  newTodayDate: string;
};

export type Progress = {
  version: 1;
  cards: Partial<Record<CardKey, Card>>;
  settings: Settings;
  stats: Stats;
};

const DEFAULT_SETTINGS: Settings = {
  modes: ["numberToNama"],
  dailyNew: 10,
  dailyMaxReviews: 80,
};

const DEFAULT_STATS: Stats = {
  totalReviews: 0,
  totalLapses: 0,
  streakDays: 0,
  reviewsToday: 0,
  reviewsTodayDate: todayIso(),
  newToday: 0,
  newTodayDate: todayIso(),
};

export function emptyProgress(): Progress {
  return {
    version: 1,
    cards: {},
    settings: { ...DEFAULT_SETTINGS },
    stats: { ...DEFAULT_STATS },
  };
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Progress;
    if (parsed.version !== 1) return emptyProgress();
    // Patch missing keys for forward-compat
    return {
      version: 1,
      cards: parsed.cards ?? {},
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      stats: { ...DEFAULT_STATS, ...parsed.stats },
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // quota or private mode — swallow
  }
}

/** Roll over the per-day counters when the calendar day changes. */
function rollDailyCounters(stats: Stats, now: Date): Stats {
  const today = todayIso(now);
  let s = stats;
  if (s.reviewsTodayDate !== today) {
    s = { ...s, reviewsToday: 0, reviewsTodayDate: today };
  }
  if (s.newTodayDate !== today) {
    s = { ...s, newToday: 0, newTodayDate: today };
  }
  return s;
}

/**
 * Build today's review queue: due cards first (in due-order), then up to
 * `dailyNew` brand-new cards drawn in nāma order so order is preserved.
 */
export function buildQueue(
  progress: Progress,
  now: Date = new Date(),
): Card[] {
  const { settings, cards } = progress;
  const dueCards: Card[] = [];
  const knownKeys = new Set<string>();

  for (const key in cards) {
    const c = cards[key as CardKey];
    if (!c) continue;
    knownKeys.add(key);
    if (settings.modes.includes(c.mode) && isDue(c, now)) {
      dueCards.push(c);
    }
  }

  // Sort due cards: oldest due first, then by nāma number for stable order.
  dueCards.sort((a, b) => {
    if (a.due !== b.due) return a.due < b.due ? -1 : 1;
    return a.nama - b.nama;
  });

  // Build new-card candidates in nāma order (1..1000) for each enabled mode.
  // Interleave modes so the user sees variety, but PRIORITIZE order: nāma 1
  // before nāma 2 across all modes.
  const newCandidates: Card[] = [];
  const maxNew = Math.max(
    0,
    settings.dailyNew - progress.stats.newToday,
  );
  outer: for (let n = 1; n <= 1000; n++) {
    for (const mode of settings.modes) {
      if (!isValidNama(mode, n)) continue;
      const key = cardKey(mode, n);
      if (knownKeys.has(key)) continue;
      newCandidates.push(createCard(mode, n, now));
      if (newCandidates.length >= maxNew) break outer;
    }
  }

  const remainingCap = Math.max(
    0,
    settings.dailyMaxReviews - progress.stats.reviewsToday,
  );

  // Cap total session size at remaining daily cap.
  const queue = [...dueCards, ...newCandidates];
  return queue.slice(0, remainingCap);
}

/** Apply a review and persist it. Returns the updated progress. */
export function applyReview(
  progress: Progress,
  card: Card,
  quality: Quality,
  now: Date = new Date(),
): Progress {
  const reviewed = review(card, quality, now);
  const key = cardKey(card.mode, card.nama);
  const wasNew = isNew(card);
  const wasLapse = quality < 3;

  let stats = rollDailyCounters(progress.stats, now);
  stats = {
    ...stats,
    totalReviews: stats.totalReviews + 1,
    totalLapses: stats.totalLapses + (wasLapse ? 1 : 0),
    reviewsToday: stats.reviewsToday + 1,
    newToday: stats.newToday + (wasNew ? 1 : 0),
    lastSessionDate: todayIso(now),
  };

  // Streak: if the previous session date is exactly yesterday, increment;
  // if it's today, keep; otherwise reset to 1.
  const prev = progress.stats.lastSessionDate;
  const today = todayIso(now);
  if (prev !== today) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    stats.streakDays =
      prev === todayIso(yesterday) ? progress.stats.streakDays + 1 : 1;
  }

  return {
    ...progress,
    stats,
    cards: { ...progress.cards, [key]: reviewed },
  };
}

/** Summary numbers for the dashboard. */
export function counts(progress: Progress, now: Date = new Date()) {
  let due = 0;
  let learning = 0;
  let mature = 0;
  for (const key in progress.cards) {
    const c = progress.cards[key as CardKey];
    if (!c) continue;
    if (!progress.settings.modes.includes(c.mode)) continue;
    if (isDue(c, now)) due++;
    if (c.reps > 0 && c.interval < 21) learning++;
    if (c.interval >= 21) mature++;
  }
  return { due, learning, mature };
}

export { ALL_MODES };
