import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import React from "react";
import { CHAPTERS } from "@/constants/themes";
import ThemesView from "./themes-view";

const loadCommentary = (filename: string): Record<string, string> => {
  const filePath = path.join(
    process.cwd(),
    `src/commentaries-json/${filename}`,
  );
  const text = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(text) as Record<string, string>;
};

const commentaries = {
  root: loadCommentary("root.json"),
  "V. Ravi": loadCommentary("vravi.json"),
  "Sanskrit Documents": loadCommentary("sanskritdocuments.json"),
};

// Canonical name list from the Sanskrit Documents JSON (1..1000 in order)
const names = Object.keys(commentaries["Sanskrit Documents"]);

export const metadata = {
  title: "Themes — Lalita Sahasranama",
  description:
    "The 1000 nāmas of Lalita Sahasranāma grouped into thematic sections for memorisation.",
};

export default function ThemesPage() {
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
            <Link href="/themes" className="text-[#c2410c]">
              Themes
            </Link>
            <Link href="/vravi" className="hover:text-[#c2410c]">
              V. Ravi
            </Link>
          </nav>
        </div>
      </div>

      <section className="container mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-[#2b1700] sm:text-5xl">
            Themes
          </h1>
          <hr className="paper-rule mx-auto w-48" />
          <p className="mt-4 text-base leading-relaxed text-[#5a3a18]">
            The 1000 nāmas told as {CHAPTERS.length} chapters of one story.
            Every chapter boundary is anchored to V. Ravi's own commentary —
            quoted in italics when you expand a chapter. Tap a chapter to see
            V. Ravi's anchor and the sub-themes; tap a sub-theme to see its
            nāmas; tap any nāma for its root breakdown and commentaries.
          </p>
        </header>

        <ThemesView
          chapters={CHAPTERS}
          names={names}
          commentaries={commentaries}
        />
      </section>

      <footer className="border-t border-[#2b1700]/15">
        <div className="container mx-auto px-4 py-8 text-center text-xs text-[#5a3a18]">
          Sections drawn from the traditional structure used in Bhāskararāya's
          Saubhāgya-bhāskara and V. Ravi's English commentary.
        </div>
      </footer>
    </>
  );
}
