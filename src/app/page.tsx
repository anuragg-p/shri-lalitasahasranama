import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import React from "react";
import VersesDisplay from "./verses-display";

const sanskritFilePath = path.join(process.cwd(), "src/constants/sanskrit.txt");
const sanskritText = fs.readFileSync(sanskritFilePath, "utf-8");

/**
 * Aliases for verse-form spellings that don't match the keys generated from
 * the commentary text. Each alias maps an alternate form (as it appears in
 * sanskrit.txt) to either a single canonical key in the JSON, or a list of
 * keys whose commentaries should be concatenated.
 */
const COMMENTARY_ALIASES: Record<string, string | string[]> = {
  // Spelling variants between sanskrit.txt and the JSON keys
  "वारुणीमदविह्वला": "वारुणी मदविव्हला",
  "राज्यलक्ष्मीः": "राज्यलक्ष्मी",
  "शिवशक्त्यैक्यरूपिणी": "शिवशक्तैक्यरूपिणी",
  "सुधासृतिः": "सुधास्रुतिः / सृतिः",
  "त्रिगुणाम्बा": "त्रिगुणा",
  // Alternate traditional name spellings — sanskrit.txt uses one variant, the
  // commentaries use another. Map sanskrit.txt → commentary key.
  "बन्धुरालका": "बर्बरालका",
};

const loadCommentary = (filename: string): Record<string, string> => {
  const filePath = path.join(process.cwd(), `src/commentaries-json/${filename}`);
  const text = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(text) as Record<string, string>;
  // Augment with aliases so verse words resolve to commentary keys.
  for (const [alias, target] of Object.entries(COMMENTARY_ALIASES)) {
    if (data[alias]) continue;
    if (typeof target === "string") {
      const value = data[target];
      if (value) data[alias] = value;
    } else {
      const parts = target
        .map((key) => {
          const t = data[key];
          return t ? `${key}\n${t}` : null;
        })
        .filter((p): p is string => p !== null);
      if (parts.length > 0) data[alias] = parts.join("\n\n");
    }
  }
  return data;
};

const commentaries = {
  root: loadCommentary("root.json"),
  Bhaskaraya: loadCommentary("bhaskaraya.json"),
  "V. Ravi": loadCommentary("vravi.json"),
  "Sanskrit Documents": loadCommentary("sanskritdocuments.json"),
};

export default function Home() {
  return (
    <>
      <div className="border-b border-[#2b1700]/15">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#c2410c] font-extrabold text-[#fff8e1] shadow-sm">
              ॐ
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[#2b1700]">
              Lalita<span className="text-[#c2410c]">.</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-semibold text-[#2b1700]">
            <Link href="/" className="hover:text-[#c2410c]">
              Verses
            </Link>
            <Link href="/vravi" className="hover:text-[#c2410c]">
              V. Ravi
            </Link>
          </nav>
        </div>
      </div>

      <section className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <VersesDisplay
          sanskritText={sanskritText}
          commentaries={commentaries}
        />
      </section>

      <footer className="border-t border-[#2b1700]/15">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 py-8 text-xs text-[#5a3a18] sm:flex-row sm:justify-between">
          <p>
            Lalita Sahasranama — for personal study. Commentaries by their
            respective authors.
          </p>
          <p>
            Tap a word · then{" "}
            <span className="font-semibold text-[#c2410c]">Next nāma →</span> to
            walk through all 1000.
          </p>
        </div>
      </footer>
    </>
  );
}
