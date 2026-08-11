"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RootBreakdown } from "@/components/root-breakdown";
import NamaSearch from "@/components/nama-search";
import { buildNameEntries } from "@/lib/phonetic-search";
import { devanagariToIAST } from "@/lib/transliterate";
import type { Chapter, ThemeGroup } from "@/constants/themes";

type Commentaries = Record<string, Record<string, string>>;

interface ThemesViewProps {
  chapters: Chapter[];
  names: string[];
  commentaries: Commentaries;
}

export default function ThemesView({
  chapters,
  names,
  commentaries,
}: ThemesViewProps) {
  // Two independent sets so users can drill in chapter-by-chapter.
  const [openChapters, setOpenChapters] = useState<Set<number>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  // Nāma to scroll to / open after a search selection expanded its section
  const [focusNama, setFocusNama] = useState<number | null>(null);

  const searchIndex = useMemo(
    () =>
      buildNameEntries(
        names,
        (_i, name) => commentaries["Sanskrit Documents"]?.[name] ?? "",
      ),
    [names, commentaries],
  );

  const handleSearchSelect = useCallback(
    (id: string) => {
      const n = Number(id);
      for (const [ci, chapter] of chapters.entries()) {
        for (const [gi, group] of chapter.groups.entries()) {
          const [start, end] = group.range;
          if (n >= start && n <= end) {
            setOpenChapters((prev) => new Set(prev).add(ci));
            setOpenGroups((prev) => new Set(prev).add(`${ci}-${gi}`));
            setFocusNama(n);
            return;
          }
        }
      }
    },
    [chapters],
  );

  const handleFocusConsumed = useCallback(() => setFocusNama(null), []);

  const toggleChapter = (idx: number) =>
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const collapseAll = () => {
    setOpenChapters(new Set());
    setOpenGroups(new Set());
  };

  return (
    <>
      <div className="sticky top-0 z-40 -mx-2 mb-4 px-2 py-3">
        <NamaSearch entries={searchIndex} onSelect={handleSearchSelect} />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#2b1700]/15 pb-3 text-xs font-bold tracking-widest text-[#8a6a3c] uppercase">
        <span>{chapters.length} chapters · 1000 nāmas</span>
        <button onClick={collapseAll} className="pill-tab">
          Collapse all
        </button>
      </div>

      <div className="space-y-6">
        {chapters.map((chapter, ci) => {
          const [cStart, cEnd] = chapter.range;
          const isOpen = openChapters.has(ci);
          return (
            <article key={ci} className="sticker-card p-5 sm:p-6">
              <button
                type="button"
                onClick={() => toggleChapter(ci)}
                className="flex w-full items-start gap-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="number-pill mt-1.5 shrink-0">
                  {String(ci + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <h2 className="text-xl leading-tight font-extrabold text-[#2b1700] sm:text-2xl">
                    {chapter.title}
                  </h2>
                  <p className="mt-1 text-xs font-bold tracking-widest text-[#8a6a3c] uppercase">
                    Nāmas {cStart}—{cEnd} · {chapter.groups.length} sub-themes
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5a3a18]">
                    {chapter.summary}
                  </p>
                </div>
                <span
                  aria-hidden
                  className={`mt-2 shrink-0 text-lg font-bold text-[#c2410c] transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  ▸
                </span>
              </button>

              {isOpen && (
                <div className="mt-5 space-y-3 border-t-2 border-dashed border-[#2b1700]/20 pt-5">
                  {chapter.anchor && (
                    <blockquote className="mb-4 border-l-2 border-[#c2410c]/60 bg-[#c2410c]/5 px-4 py-2 text-xs text-[#5a3a18] italic">
                      <span className="mr-2 font-bold tracking-widest text-[#c2410c] uppercase">
                        V. Ravi:
                      </span>
                      {chapter.anchor}
                    </blockquote>
                  )}
                  {chapter.groups.map((group, gi) => (
                    <SubGroup
                      key={`${ci}-${gi}`}
                      group={group}
                      open={openGroups.has(`${ci}-${gi}`)}
                      onToggle={() => toggleGroup(`${ci}-${gi}`)}
                      names={names}
                      commentaries={commentaries}
                      focusNama={focusNama}
                      onFocusConsumed={handleFocusConsumed}
                    />
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function SubGroup({
  group,
  open,
  onToggle,
  names,
  commentaries,
  focusNama,
  onFocusConsumed,
}: {
  group: ThemeGroup;
  open: boolean;
  onToggle: () => void;
  names: string[];
  commentaries: Commentaries;
  focusNama: number | null;
  onFocusConsumed: () => void;
}) {
  const [start, end] = group.range;
  return (
    <div className="rounded-lg border border-[#2b1700]/15 bg-[#faf2dc]/60 p-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={open}
      >
        <span className="mt-0.5 shrink-0 font-mono text-xs font-bold tracking-wider text-[#8a6a3c]">
          {start}—{end}
        </span>
        <div className="flex-1">
          <h3 className="text-base font-bold text-[#2b1700]">{group.title}</h3>
          <p className="mt-0.5 text-sm text-[#5a3a18] italic">
            {group.summary}
          </p>
        </div>
        <span
          aria-hidden
          className={`mt-0.5 shrink-0 text-sm font-bold text-[#c2410c] transition-transform ${
            open ? "rotate-90" : ""
          }`}
        >
          ▸
        </span>
      </button>

      {open && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-[#2b1700]/15 pt-4">
          {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(
            (nameNumber) => {
              const name = names[nameNumber - 1];
              if (!name) return null;
              return (
                <NamaChip
                  key={nameNumber}
                  number={nameNumber}
                  name={name}
                  commentaries={commentaries}
                  focused={focusNama === nameNumber}
                  onFocusConsumed={onFocusConsumed}
                />
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

function NamaChip({
  number,
  name,
  commentaries,
  focused = false,
  onFocusConsumed,
}: {
  number: number;
  name: string;
  commentaries: Commentaries;
  focused?: boolean;
  onFocusConsumed?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // When a search selection lands on this chip, scroll to it and open it.
  useEffect(() => {
    if (focused) {
      triggerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setOpen(true);
      onFocusConsumed?.();
    }
  }, [focused, onFocusConsumed]);

  const available = Object.entries(commentaries)
    .map(([source, dict]) => ({ source, text: dict[name] }))
    .filter(
      (e): e is { source: string; text: string } =>
        !!e.text && e.text.trim().length > 0,
    )
    .sort((a, b) => {
      if (a.source === "root") return -1;
      if (b.source === "root") return 1;
      return 0;
    });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          className="font-sanskrit sticker-chip text-base"
          title={`Nāma ${number}`}
        >
          <span className="font-mono text-[10px] font-bold tracking-wider text-[#8a6a3c]">
            {number}
          </span>
          <span>{name}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="paper-popover z-50 flex max-h-[500px] w-[24rem] max-w-[92vw] flex-col p-0"
      >
        <NamaPopoverContent
          number={number}
          name={name}
          available={available}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

function NamaPopoverContent({
  number,
  name,
  available,
  onClose,
}: {
  number: number;
  name: string;
  available: Array<{ source: string; text: string }>;
  onClose: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = available[activeIdx] ?? null;

  const tabLabel = (source: string) => (source === "root" ? "Root" : source);

  return (
    <>
      <div className="flex-shrink-0 space-y-3 px-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <span className="number-pill mt-1.5">N° {number}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#8a6a3c] hover:text-[#2b1700]"
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div>
          <h3 className="font-sanskrit text-2xl leading-tight font-extrabold text-[#2b1700]">
            {name}
          </h3>
          <p className="mt-1 text-sm text-[#8a6a3c] italic">
            {devanagariToIAST(name)}
          </p>
        </div>

        {available.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {available.map((entry, i) => (
              <button
                key={entry.source}
                onClick={() => setActiveIdx(i)}
                className={`pill-tab ${
                  i === activeIdx
                    ? entry.source === "root"
                      ? "pill-tab--saffron"
                      : "pill-tab--active"
                    : ""
                }`}
              >
                {tabLabel(entry.source)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-4 text-sm leading-relaxed text-[#2b1700]/85"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {!active ? (
          <p className="text-[#8a6a3c] italic">No commentary available.</p>
        ) : active.source === "root" ? (
          <RootBreakdown text={active.text} />
        ) : active.text.includes("\n") ? (
          active.text
            .split("\n")
            .filter((l) => l.trim())
            .map((line, i) => (
              <p key={i} className={i > 0 ? "mt-2" : ""}>
                {line}
              </p>
            ))
        ) : (
          <p>{active.text}</p>
        )}
      </div>
    </>
  );
}
