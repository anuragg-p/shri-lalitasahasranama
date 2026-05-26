"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * Parse the root.txt entry text into a drillable tree:
 *   Line 1: top-level split with underscores ("श्री_माता")
 *   Lines 2+: "<word> -> <meanings> [√<root>]" or "<word> -> <sub_split>"
 */
export function parseRootText(text: string) {
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

export function RootBreakdown({ text }: { text: string }) {
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [focusedPart, setFocusedPart] = useState<string | null>(null);

  const parsed = useMemo(() => parseRootText(text), [text]);

  useEffect(() => {
    setDrillPath([]);
    setFocusedPart(null);
  }, [text]);

  if (!parsed) return <p className="text-[#5a3a18]">{text}</p>;

  const { topLevel, lookup } = parsed;

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

  // Walk a compound part down to its leaf glosses (in source order) so we can
  // show its meaning inline without making the user drill in.
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
              className={`font-sanskrit font-semibold ${
                isFocused ? "text-[#7c1d1d]" : "text-[#c2410c]"
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
              isFocused ? "font-semibold text-[#7c1d1d]" : "text-[#c2410c]"
            }`}
          >
            {part}
          </span>
          {root && (
            <span className="shrink-0 text-xs text-[#8a6a3c]">{root}</span>
          )}
        </div>
        <p className={`mt-0.5 ${isFocused ? "text-[#2b1700]" : "text-[#5a3a18]"}`}>
          {meaningText}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-3">
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

      <div className="space-y-2 pt-1">
        {focusedPart && renderMeaning(focusedPart, "focused")}
        {parts
          .filter((part) => part !== focusedPart)
          .map((part, i) => renderMeaning(part, `leaf-${i}`))}
      </div>
    </div>
  );
}
