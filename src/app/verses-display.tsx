"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VersesDisplayProps {
  sanskritText: string;
  commentaries: Record<string, string>;
}

/**
 * Parse a verse line into words, preserving dashes within compound words
 */
function parseWordsFromLine(line: string): Array<{ word: string; isWord: boolean }> {
  const result: Array<{ word: string; isWord: boolean }> = [];
  
  // Split by verse numbers (॥ १॥ etc) to preserve them
  const parts = line.split(/(॥\s*[०-९\d]+\s*॥)/);
  
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
    
    for (let j = 0; j < words.length; j++) {
      const word = words[j];
      if (!word) continue;
      
      // Remove trailing punctuation like । but keep it separate
      const match = word.match(/^(.+?)([।]*)$/);
      if (match) {
        const mainWord = match[1];
        const punctuation = match[2];
        
        if (mainWord && mainWord.length >= 1) {
          result.push({ word: mainWord, isWord: true });
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
 * Find commentary for a name, trying with and without dashes
 */
function findCommentary(
  name: string,
  commentaries: Record<string, string>
): string | null {
  // Try exact match first
  if (commentaries[name]) {
    return commentaries[name];
  }

  // Try without dashes (commentaries may have dashes)
  const nameWithoutDashes = name.replace(/-/g, "");
  if (commentaries[nameWithoutDashes]) {
    return commentaries[nameWithoutDashes];
  }

  // Try matching by removing dashes from both
  for (const key in commentaries) {
    const keyWithoutDashes = key.replace(/-/g, "");
    if (keyWithoutDashes === nameWithoutDashes) {
      const value = commentaries[key];
      return value ?? null;
    }
  }

  return null;
}

function WordPopover({
  word,
  commentaries,
}: {
  word: string;
  commentaries: Record<string, string>;
}) {
  const commentary = findCommentary(word, commentaries);

  if (!commentary) {
    // If no commentary, just render as normal text
    return <span>{word}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="cursor-pointer hover:text-yellow-300 transition-colors underline decoration-dotted decoration-yellow-600/50 underline-offset-2">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-80 max-w-[90vw] bg-[#412100] text-white border-yellow-600 z-50"
      >
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-yellow-300 font-sanskrit">
            {word}
          </h3>
          <p className="text-white/90 leading-relaxed text-sm">
            {commentary}
          </p>
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

  return (
    <div className="font-sanskrit mx-auto max-w-3xl text-left text-lg leading-relaxed">
      {lines.map((line: string, index: number) => {
        // Handle empty lines
        if (!line.trim()) {
          return <p key={index} className="mb-2" />;
        }

        // Parse the line into words and punctuation
        const parsed = parseWordsFromLine(line);

        return (
          <p key={index} className="mb-2">
            {parsed.map((item, wordIndex) => {
              if (item.isWord) {
                return (
                  <WordPopover
                    key={`${index}-${wordIndex}`}
                    word={item.word}
                    commentaries={commentaries}
                  />
                );
              }
              return <span key={`${index}-${wordIndex}`}>{item.word}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}
