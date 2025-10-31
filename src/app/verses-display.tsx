"use client";

import React, { useState, useRef, useEffect } from "react";
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
function parseWordsFromLine(line: string): Array<{ word: string; isWord: boolean; breakdownComponents?: string[] }> {
  const result: Array<{ word: string; isWord: boolean; breakdownComponents?: string[] }> = [];
  
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
    const word = wordBeforeBrackets.replace(/[।॥]*$/, '');
    if (word) {
      const components = componentsStr.split(/\s*\+\s*/).map(c => c.trim()).filter(Boolean);
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
    
    for (let j = 0; j < words.length; j++) {
      const word = words[j];
      if (!word) continue;
      
      // Remove trailing punctuation like । but keep it separate
      const match = word.match(/^(.+?)([।]*)$/);
      if (match) {
        const mainWord = match[1];
        const punctuation = match[2];
        
        if (mainWord && mainWord.length >= 1) {
          // Check if this word has breakdown components
          const components = breakdowns.get(mainWord);
          if (components) {
            result.push({ word: mainWord, isWord: true, breakdownComponents: components });
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
 * Find commentary for a name from a specific commentary source, trying with and without dashes, and handling avagraha
 */
function findCommentary(
  name: string,
  commentarySource: Record<string, string>
): string | null {
  // Special case for ॐ (om)
  if (name === "ॐ" || name === "ओं") {
    return "The primordial Sound";
  }
  
  // Try exact match first
  if (commentarySource[name]) {
    return commentarySource[name];
  }

  // Try replacing avagraha (ऽ) with 'अ' - handles cases like "सर्वारुणाऽनवद्याङ्गी"
  if (name.includes("ऽ")) {
    const nameWithA = name.replace(/ऽ/g, "अ");
    if (commentarySource[nameWithA]) {
      return commentarySource[nameWithA];
    }
    
    // Also try splitting on avagraha and combining commentaries if both parts exist
    const parts = name.split("ऽ");
    if (parts.length === 2) {
      const part1 = parts[0];
      const part2 = parts[1];
      
      if (part1 && part2) {
        const commentary1 = commentarySource[part1];
        const commentary2 = commentarySource[part2];
        
        if (commentary1 && commentary2) {
          return `${commentary1} ${commentary2}`;
        } else if (commentary1) {
          return commentary1;
        } else if (commentary2) {
          return commentary2;
        }
        
        // Try with 'अ' added to first part
        const part1WithA = part1 + "अ";
        const commentary1WithA = commentarySource[part1WithA];
        if (commentary1WithA && commentary2) {
          return `${commentary1WithA} ${commentary2}`;
        }
      }
    }
  }

  // Try without dashes
  const nameWithoutDashes = name.replace(/-/g, "");
  if (commentarySource[nameWithoutDashes]) {
    return commentarySource[nameWithoutDashes];
  }

  // Try matching by removing dashes from both
  for (const key in commentarySource) {
    const keyWithoutDashes = key.replace(/-/g, "");
    if (keyWithoutDashes === nameWithoutDashes) {
      return commentarySource[key] ?? null;
    }
  }

  return null;
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
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  
  // Initialize selected tab based on preference or first available
  useEffect(() => {
    if (isOpen) {
      const availableTabs = Object.keys(commentariesBySource).filter(
        key => commentariesBySource[key] !== null && commentariesBySource[key] !== undefined
      );
      
      if (availableTabs.length > 0) {
        // Use preferred tab if it exists for this word, otherwise use first available
        const tabToUse = (preferredTab && availableTabs.includes(preferredTab)) 
          ? preferredTab 
          : availableTabs[0];
        
        if (tabToUse) {
          setSelectedTab(tabToUse);
        }
      }
    }
  }, [isOpen, commentariesBySource, preferredTab]);
  
  // Handle tab selection and update preference
  const handleTabClick = (tabName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTab(tabName);
    onTabChange(tabName);
  };
  const triggerRef = useRef<HTMLSpanElement>(null);

  const handlePopoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNext();
  };

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
          className="cursor-pointer hover:text-yellow-300 transition-colors underline decoration-dotted decoration-yellow-600/50 underline-offset-2"
        >
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-80 max-w-[90vw] bg-[#412100] text-white border-yellow-600 z-50 h-[400px] overflow-y-auto"
        onClick={handlePopoverClick}
      >
        <div className="space-y-3 cursor-pointer">
          <h3 className="text-lg font-bold text-yellow-300 font-sanskrit">
            {word}
          </h3>
          
          {/* Tabs */}
          <div className="flex border-b border-yellow-600/30 -mx-1 px-1">
            {Object.keys(commentariesBySource).map((tabName) => {
              if (!commentariesBySource[tabName]) return null;
              const isSelected = selectedTab === tabName;
              return (
                <button
                  key={tabName}
                  onClick={(e) => handleTabClick(tabName, e)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'text-yellow-300 border-b-2 border-yellow-300'
                      : 'text-white/70 hover:text-white/90'
                  }`}
                >
                  {tabName}
                </button>
              );
            })}
          </div>
          
          <div className="text-white/90 leading-relaxed text-sm space-y-3">
            {selectedTab && commentariesBySource[selectedTab] && (
              <>
                {commentariesBySource[selectedTab].includes('\n\n') ? (
                  // Multiple components: each has Sanskrit name and meaning
                  commentariesBySource[selectedTab].split('\n\n').map((component, idx) => {
                    const lines = component.split('\n');
                    const sanskritName = lines[0];
                    const meaning = lines.slice(1).join(' ');
                    return (
                      <div key={idx} className={idx > 0 ? 'pt-2 border-t border-yellow-600/30' : ''}>
                        <p className="font-sanskrit text-yellow-300 font-medium mb-1">
                          {sanskritName}
                        </p>
                        <p className="text-white/90">
                          {meaning}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  // Single meaning (regular word)
                  <p>{commentariesBySource[selectedTab]}</p>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-white/50 italic mt-2">
            Click to see next name
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
  const [openWordId, setOpenWordId] = useState<string | null>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [preferredCommentaryTab, setPreferredCommentaryTab] = useState<string | null>(null);

  // Create a map of wordId -> commentaries by matching words to commentary names
  const wordToCommentaryMap = new Map<string, { word: string; commentariesBySource: Record<string, string>; breakdownComponents?: string[] }>();
  
  // Pattern to detect concluding line (should not be processed for word matching)
  const concludingLinePattern = /एवं\s+श्रीललिता\s+देव्या\s+नाम्नां\s+साहस्रकं\s+जगुः/;
  
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
          for (const [sourceName, sourceCommentaries] of Object.entries(commentaries)) {
            const componentEntries: Array<{ sanskrit: string; meaning: string }> = [];
            for (const component of item.breakdownComponents) {
              const compCommentary = findCommentary(component, sourceCommentaries);
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
                .map(entry => `${entry.sanskrit}\n${entry.meaning}`)
                .join('\n\n');
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
          for (const [sourceName, sourceCommentaries] of Object.entries(commentaries)) {
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
    const [lineIndex, wordIndex] = wordId.replace("word-", "").split("-").map(Number);
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
    (w) => w.id === openWordId
  );

  const handleNextWord = () => {
    if (wordsWithCommentaries.length === 0) return;
    
    const nextIndex = currentWordIndex >= 0 
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
                return <span key={`${lineIndex}-${wordIndex}`}>{item.word}</span>;
              }
              return <span key={`${lineIndex}-${wordIndex}`}>{item.word}</span>;
            })}
          </p>
        );
      })}
      
      {/* Render concluding line at the end with special styling */}
      {concludingLine && (
        <div className="mt-12 pt-8 border-t border-yellow-600/30">
          <p className="text-center text-xl font-semibold text-yellow-200">
            {concludingLine}
          </p>
        </div>
      )}
    </div>
  );
}
