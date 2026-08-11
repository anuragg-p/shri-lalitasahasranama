"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  searchEntries,
  toSearchKey,
  type SearchEntry,
} from "@/lib/phonetic-search";

/**
 * Type-to-find box for nāmas: accepts casual romanization ("shri mata",
 * "tanumadhya") and fuzzy-matches it against the transliterated verse words.
 */
export default function NamaSearch({
  entries,
  onSelect,
}: {
  entries: SearchEntry[];
  onSelect: (wordId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => searchEntries(entries, query),
    [entries, query],
  );
  const queryKeyLength = toSearchKey(query).length;

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  // Close the dropdown on outside click/tap
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const select = (wordId: string) => {
    onSelect(wordId);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && event.key !== "Escape") setIsOpen(true);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      const hit = results[highlightIndex];
      if (hit) select(hit.id);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Keep the highlighted row visible while arrowing through results
  useEffect(() => {
    const row = listRef.current?.children[highlightIndex];
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  const showDropdown = isOpen && queryKeyLength >= 3;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder='Search by sound — try "shri mata" or "tanumadhya"'
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="nama-search-results"
        aria-autocomplete="list"
        className="w-full rounded-xl border-2 border-[#2b1700] bg-[#faf2dc] px-4 py-2 text-[15px] font-medium text-[#2b1700] shadow-[3px_3px_0_0_#2b1700] placeholder:text-[#8a6a3c]/70 focus:ring-2 focus:ring-[#c2410c]/50 focus:outline-none"
      />

      {showDropdown && (
        <div
          id="nama-search-results"
          role="listbox"
          ref={listRef}
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border-2 border-[#2b1700] bg-[#faf2dc] shadow-[6px_6px_0_0_#2b1700]"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#5a3a18]">
              No nāma matched — try fewer letters or another spelling.
            </p>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                type="button"
                role="option"
                aria-selected={index === highlightIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(result.id)}
                onMouseEnter={() => setHighlightIndex(index)}
                className={`block w-full border-b border-dashed border-[#2b1700]/15 px-4 py-2.5 text-left last:border-b-0 ${
                  index === highlightIndex ? "bg-[#fde68a]/70" : ""
                }`}
              >
                <span className="flex flex-wrap items-baseline gap-x-2">
                  {result.badge && (
                    <span className="font-mono text-[10px] font-bold tracking-wider text-[#8a6a3c]">
                      {result.badge}
                    </span>
                  )}
                  <span className="font-sanskrit text-base font-bold text-[#2b1700]">
                    {result.devanagari}
                  </span>
                  <span className="text-xs text-[#c2410c] italic">
                    {result.iast}
                  </span>
                </span>
                {result.gloss && (
                  <span className="mt-0.5 line-clamp-1 block text-xs text-[#5a3a18]">
                    {result.gloss}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
