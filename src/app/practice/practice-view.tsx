"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RootBreakdown } from "@/components/root-breakdown";
import {
  type Card,
  type Mode,
  type Quality,
  ALL_MODES,
  MODE_LABELS,
} from "@/lib/srs";
import {
  type Progress,
  type Settings,
  applyReview,
  buildQueue,
  counts,
  emptyProgress,
  loadProgress,
  saveProgress,
} from "@/lib/srs-storage";

interface PracticeViewProps {
  names: string[]; // 1000 nāmas in order
  shortMeanings: Record<number, string>;
  vraviText: Record<number, string>;
  rootText: Record<number, string>;
}

export default function PracticeView(props: PracticeViewProps) {
  const [progress, setProgress] = useState<Progress | null>(null); // null until hydrated
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExtra, setShowExtra] = useState<"none" | "root" | "vravi">("none");
  const [sessionReviews, setSessionReviews] = useState(0);
  const [sessionStartedAt] = useState(() => Date.now());

  // Hydrate progress from localStorage on mount.
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // Save whenever progress changes.
  useEffect(() => {
    if (progress) saveProgress(progress);
  }, [progress]);

  // Build today's queue lazily.
  const queue = useMemo(() => {
    if (!progress) return [];
    return buildQueue(progress);
  }, [progress]);

  const currentCard: Card | undefined = queue[0];

  // Counts shown in the dashboard
  const summary = useMemo(
    () => (progress ? counts(progress) : { due: 0, learning: 0, mature: 0 }),
    [progress],
  );

  const handleReveal = useCallback(() => {
    setShowAnswer(true);
  }, []);

  const handleRate = useCallback(
    (q: Quality) => {
      if (!progress || !currentCard) return;
      const next = applyReview(progress, currentCard, q);
      setProgress(next);
      setSessionReviews((n) => n + 1);
      setShowAnswer(false);
      setShowExtra("none");
    },
    [progress, currentCard],
  );

  const handleSkip = useCallback(() => {
    setShowAnswer(false);
    setShowExtra("none");
    // Mark current as "Hard" with no advancement? Better: skip with no SRS update.
    // We achieve this by pushing the card to the end of today's pool —
    // simplest implementation: just rebuild the queue from progress (which
    // moves it to the back since due-sort is stable on date+nama). For now
    // we just no-op which keeps the user on the same card; instead make this
    // a "Don't grade" by giving the card a 1-day bump via a special quality.
    // We choose to NOT include skip — keep flow simple.
  }, []);

  // Keyboard shortcuts: space to reveal; 1-4 to rate.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (!showAnswer && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        handleReveal();
      } else if (showAnswer) {
        if (e.key === "1") handleRate(0); // Again
        else if (e.key === "2") handleRate(3); // Hard
        else if (e.key === "3") handleRate(4); // Good
        else if (e.key === "4") handleRate(5); // Easy
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showAnswer, handleReveal, handleRate]);

  if (!progress) {
    return (
      <p className="text-center text-sm text-[#8a6a3c]">Loading your deck…</p>
    );
  }

  return (
    <>
      <Dashboard
        summary={summary}
        sessionReviews={sessionReviews}
        sessionStartedAt={sessionStartedAt}
        progress={progress}
        onChangeSettings={(s) =>
          setProgress({ ...progress, settings: s })
        }
      />

      {!currentCard ? (
        <EmptyState progress={progress} />
      ) : (
        <Flashcard
          card={currentCard}
          showAnswer={showAnswer}
          showExtra={showExtra}
          onReveal={handleReveal}
          onRate={handleRate}
          onShowExtra={setShowExtra}
          names={props.names}
          shortMeanings={props.shortMeanings}
          vraviText={props.vraviText}
          rootText={props.rootText}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard({
  summary,
  sessionReviews,
  sessionStartedAt,
  progress,
  onChangeSettings,
}: {
  summary: { due: number; learning: number; mature: number };
  sessionReviews: number;
  sessionStartedAt: number;
  progress: Progress;
  onChangeSettings: (s: Settings) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);

  const sessionSeconds = Math.floor((Date.now() - sessionStartedAt) / 1000);
  const sessionMin = Math.floor(sessionSeconds / 60);

  const toggleMode = (m: Mode) => {
    const has = progress.settings.modes.includes(m);
    const next = has
      ? progress.settings.modes.filter((x) => x !== m)
      : [...progress.settings.modes, m];
    onChangeSettings({
      ...progress.settings,
      modes: next.length > 0 ? next : progress.settings.modes,
    });
  };

  return (
    <div className="mb-6 sticker-card p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Due now" value={summary.due} accent="saffron" />
        <Stat label="Learning" value={summary.learning} />
        <Stat label="Mature" value={summary.mature} />
        <Stat
          label="Streak (days)"
          value={progress.stats.streakDays}
          accent="ink"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-[#2b1700]/15 pt-3 text-xs text-[#5a3a18]">
        <span>
          Session: <b>{sessionReviews}</b> reviewed
          {sessionMin > 0 ? ` · ${sessionMin} min` : ""}
        </span>
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className="pill-tab"
        >
          {showSettings ? "Hide settings" : "Settings"}
        </button>
      </div>

      {showSettings && (
        <div className="mt-3 space-y-3 border-t border-dashed border-[#2b1700]/15 pt-3">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-widest text-[#8a6a3c] uppercase">
              Active drills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMode(m)}
                  className={`pill-tab ${
                    progress.settings.modes.includes(m) ? "pill-tab--active" : ""
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberSetting
              label="New per day"
              value={progress.settings.dailyNew}
              min={0}
              max={50}
              onChange={(v) =>
                onChangeSettings({ ...progress.settings, dailyNew: v })
              }
            />
            <NumberSetting
              label="Max reviews / session"
              value={progress.settings.dailyMaxReviews}
              min={10}
              max={500}
              step={10}
              onChange={(v) =>
                onChangeSettings({
                  ...progress.settings,
                  dailyMaxReviews: v,
                })
              }
            />
          </div>
          <ExportImport progress={progress} />
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "saffron" | "ink";
}) {
  return (
    <div>
      <div
        className={`text-2xl font-extrabold tracking-tight ${
          accent === "saffron"
            ? "text-[#c2410c]"
            : accent === "ink"
              ? "text-[#7c1d1d]"
              : "text-[#2b1700]"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] font-bold tracking-widest text-[#8a6a3c] uppercase">
        {label}
      </div>
    </div>
  );
}

function NumberSetting({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold tracking-widest text-[#8a6a3c] uppercase">
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="mt-1 w-full rounded-md border border-[#2b1700]/30 bg-[#faf2dc] px-2 py-1 text-sm text-[#2b1700]"
      />
    </label>
  );
}

function ExportImport({ progress }: { progress: Progress }) {
  const download = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lsn-srs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const reset = () => {
    if (
      confirm("Reset ALL progress? This cannot be undone unless you exported.")
    ) {
      saveProgress(emptyProgress());
      window.location.reload();
    }
  };
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <button onClick={download} className="pill-tab">
        Export progress
      </button>
      <button onClick={reset} className="pill-tab">
        Reset deck
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flashcard
// ─────────────────────────────────────────────────────────────────────────────

function Flashcard({
  card,
  showAnswer,
  showExtra,
  onReveal,
  onRate,
  onShowExtra,
  names,
  shortMeanings,
  vraviText,
  rootText,
}: {
  card: Card;
  showAnswer: boolean;
  showExtra: "none" | "root" | "vravi";
  onReveal: () => void;
  onRate: (q: Quality) => void;
  onShowExtra: (e: "none" | "root" | "vravi") => void;
  names: string[];
  shortMeanings: Record<number, string>;
  vraviText: Record<number, string>;
  rootText: Record<number, string>;
}) {
  const prompt = renderPrompt(card, names, shortMeanings);
  const answer = renderAnswer(card, names, shortMeanings);

  return (
    <div className="sticker-card p-6 sm:p-8">
      {/* Mode + card-state badge */}
      <div className="mb-4 flex items-center justify-between text-[10px] font-bold tracking-widest text-[#8a6a3c] uppercase">
        <span>{MODE_LABELS[card.mode]}</span>
        <span>
          {card.reps === 0 && card.lapses === 0
            ? "New"
            : card.interval < 21
              ? `Learning · int ${card.interval}d`
              : `Mature · int ${card.interval}d`}
        </span>
      </div>

      {/* Prompt */}
      <div className="border-b border-dashed border-[#2b1700]/20 pb-5">
        <p className="text-[11px] font-bold tracking-widest text-[#c2410c] uppercase">
          {prompt.label}
        </p>
        <div className="mt-2">{prompt.body}</div>
      </div>

      {/* Answer */}
      {!showAnswer ? (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onReveal}
            className="btn-saffron inline-flex items-center gap-2"
          >
            Show answer
          </button>
          <p className="text-[10px] tracking-widest text-[#8a6a3c] uppercase">
            press space / enter
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <p className="text-[11px] font-bold tracking-widest text-[#7c1d1d] uppercase">
              {answer.label}
            </p>
            <div className="mt-2">{answer.body}</div>
          </div>

          {/* Optional deeper detail */}
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={() =>
                onShowExtra(showExtra === "vravi" ? "none" : "vravi")
              }
              className="pill-tab"
            >
              {showExtra === "vravi" ? "Hide V. Ravi" : "Show V. Ravi"}
            </button>
            <button
              type="button"
              onClick={() =>
                onShowExtra(showExtra === "root" ? "none" : "root")
              }
              className="pill-tab"
            >
              {showExtra === "root" ? "Hide root" : "Show root"}
            </button>
          </div>

          {showExtra === "vravi" && (
            <div className="mt-4 max-h-56 overflow-y-auto rounded-md border border-[#2b1700]/15 bg-[#faf2dc] p-3 text-sm leading-relaxed text-[#2b1700]/85">
              {vraviText[card.nama] || (
                <span className="italic text-[#8a6a3c]">
                  No V. Ravi commentary recorded for this nāma.
                </span>
              )}
            </div>
          )}

          {showExtra === "root" && (
            <div className="mt-4 rounded-md border border-[#2b1700]/15 bg-[#faf2dc] p-3">
              {rootText[card.nama] ? (
                <RootBreakdown text={rootText[card.nama]!} />
              ) : (
                <p className="text-sm italic text-[#8a6a3c]">
                  No root breakdown recorded yet for this nāma.
                </p>
              )}
            </div>
          )}

          <RatingButtons onRate={onRate} card={card} />
        </>
      )}
    </div>
  );
}

function RatingButtons({
  onRate,
  card,
}: {
  onRate: (q: Quality) => void;
  card: Card;
}) {
  // Preview the next-due interval for each quality (informative; not exact)
  const nextLabel = (q: Quality): string => {
    if (q === 0) return "<1d";
    const reps = card.reps + 1;
    let interval: number;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else {
      const ef = Math.max(
        1.3,
        card.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
      );
      interval = Math.max(1, Math.ceil(card.interval * ef));
    }
    return interval < 30
      ? `${interval}d`
      : interval < 365
        ? `${Math.round(interval / 30)}mo`
        : `${(interval / 365).toFixed(1)}y`;
  };

  return (
    <div className="mt-6 grid grid-cols-4 gap-2 text-sm font-bold">
      <RatingButton
        onClick={() => onRate(0)}
        color="maroon"
        label="Again"
        sub={nextLabel(0)}
        hot="1"
      />
      <RatingButton
        onClick={() => onRate(3)}
        color="ink"
        label="Hard"
        sub={nextLabel(3)}
        hot="2"
      />
      <RatingButton
        onClick={() => onRate(4)}
        color="saffron"
        label="Good"
        sub={nextLabel(4)}
        hot="3"
      />
      <RatingButton
        onClick={() => onRate(5)}
        color="paper"
        label="Easy"
        sub={nextLabel(5)}
        hot="4"
      />
    </div>
  );
}

function RatingButton({
  onClick,
  color,
  label,
  sub,
  hot,
}: {
  onClick: () => void;
  color: "maroon" | "ink" | "saffron" | "paper";
  label: string;
  sub: string;
  hot: string;
}) {
  const styles: Record<typeof color, string> = {
    maroon:
      "bg-[#7c1d1d] text-[#fff8e1] border-[#7c1d1d] hover:bg-[#5a1414]",
    ink:
      "bg-[#2b1700] text-[#fde68a] border-[#2b1700] hover:bg-[#1a0f00]",
    saffron:
      "bg-[#c2410c] text-[#fff8e1] border-[#c2410c] hover:bg-[#a13609]",
    paper:
      "bg-[#faf2dc] text-[#2b1700] border-[#2b1700] hover:bg-[#fde68a]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 px-2 py-2.5 transition-colors ${styles[color]}`}
    >
      <div className="text-base">{label}</div>
      <div className="font-mono text-[10px] opacity-80">{sub} · {hot}</div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt / Answer renderers per mode
// ─────────────────────────────────────────────────────────────────────────────

function renderPrompt(
  card: Card,
  names: string[],
  shortMeanings: Record<number, string>,
): { label: string; body: React.ReactNode } {
  if (card.mode === "numberToNama") {
    return {
      label: `Nāma number`,
      body: (
        <div className="font-mono text-5xl font-extrabold tracking-tight text-[#2b1700]">
          {card.nama}
        </div>
      ),
    };
  }
  if (card.mode === "namaToMeaning") {
    return {
      label: "Recall the meaning of",
      body: (
        <div className="font-sanskrit text-3xl font-bold text-[#7c1d1d] sm:text-4xl">
          {names[card.nama - 1] ?? "?"}
        </div>
      ),
    };
  }
  // previousToNext
  const prevName = names[card.nama - 1] ?? "?";
  const prevMeaning = shortMeanings[card.nama] ?? "";
  return {
    label: `After nāma ${card.nama} comes…`,
    body: (
      <div>
        <p className="font-sanskrit text-2xl font-bold text-[#7c1d1d]">
          {prevName}
        </p>
        <p className="mt-1 text-xs italic text-[#5a3a18]">{prevMeaning}</p>
      </div>
    ),
  };
}

function renderAnswer(
  card: Card,
  names: string[],
  shortMeanings: Record<number, string>,
): { label: string; body: React.ReactNode } {
  if (card.mode === "numberToNama") {
    const name = names[card.nama - 1] ?? "?";
    return {
      label: "Answer",
      body: (
        <div>
          <p className="font-sanskrit text-4xl font-extrabold text-[#7c1d1d]">
            {name}
          </p>
          <p className="mt-2 text-sm text-[#5a3a18]">
            {shortMeanings[card.nama] ?? ""}
          </p>
        </div>
      ),
    };
  }
  if (card.mode === "namaToMeaning") {
    return {
      label: `Nāma #${card.nama}`,
      body: (
        <p className="text-base text-[#2b1700]">
          {shortMeanings[card.nama] ?? "(no gloss)"}
        </p>
      ),
    };
  }
  // previousToNext → reveal nāma N+1
  const nextN = card.nama + 1;
  const nextName = names[nextN - 1] ?? "?";
  const nextMeaning = shortMeanings[nextN] ?? "";
  return {
    label: `Nāma ${nextN}`,
    body: (
      <div>
        <p className="font-sanskrit text-3xl font-extrabold text-[#7c1d1d]">
          {nextName}
        </p>
        <p className="mt-2 text-sm text-[#5a3a18]">{nextMeaning}</p>
      </div>
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state — no due cards and daily new cap reached / modes disabled
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ progress }: { progress: Progress }) {
  const hasModes = progress.settings.modes.length > 0;
  if (!hasModes) {
    return (
      <div className="sticker-card p-6 text-center">
        <p className="text-[#2b1700]">
          No drills are active. Open <b>Settings</b> and pick at least one drill
          mode to start studying.
        </p>
      </div>
    );
  }
  return (
    <div className="sticker-card p-6 text-center">
      <p className="text-2xl font-extrabold text-[#7c1d1d]">All caught up.</p>
      <p className="mt-2 text-sm text-[#5a3a18]">
        Nothing more is due today, and you've hit the daily-new cap. Come back
        tomorrow — spaced repetition only works if you let the intervals breathe.
      </p>
      <p className="mt-4 text-xs text-[#8a6a3c]">
        Streak: <b>{progress.stats.streakDays}</b> day
        {progress.stats.streakDays === 1 ? "" : "s"} · Total reviews:{" "}
        <b>{progress.stats.totalReviews}</b>
      </p>
    </div>
  );
}
