import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import React from "react";
import PracticeView from "./practice-view";

const loadJson = (filename: string): Record<string, string> => {
  const filePath = path.join(
    process.cwd(),
    `src/commentaries-json/${filename}`,
  );
  const text = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(text) as Record<string, string>;
};

const sanskritDocs = loadJson("sanskritdocuments.json");
const vravi = loadJson("vravi.json");
const root = loadJson("root.json");

// Canonical 1000 nāmas in order, from the Sanskrit Documents JSON.
const names = Object.keys(sanskritDocs);

// Short one-line meanings (sanskritdocuments) — the gloss shown on flip.
const shortMeanings: Record<number, string> = {};
names.forEach((name, i) => {
  shortMeanings[i + 1] = sanskritDocs[name] ?? "";
});
// V. Ravi commentary (longer; rendered on "show more")
const vraviText: Record<number, string> = {};
names.forEach((name, i) => {
  vraviText[i + 1] = vravi[name] ?? "";
});

// Root breakdown text (for the "show root" affordance)
const rootText: Record<number, string> = {};
names.forEach((name, i) => {
  rootText[i + 1] = root[name] ?? "";
});

export const metadata = {
  title: "Practice — Lalita Sahasranama",
  description:
    "Spaced repetition flashcards and active-recall drills for memorising the 1000 nāmas.",
};

export default function PracticePage() {
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
            <Link href="/themes" className="hover:text-[#c2410c]">
              Themes
            </Link>
            <Link href="/practice" className="text-[#c2410c]">
              Practice
            </Link>
            <Link href="/vravi" className="hover:text-[#c2410c]">
              V. Ravi
            </Link>
          </nav>
        </div>
      </div>

      <section className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2b1700] sm:text-4xl">
            Practice
          </h1>
          <hr className="paper-rule my-3 w-32" />
          <p className="text-sm leading-relaxed text-[#5a3a18]">
            Spaced repetition + active recall — the only two memorisation
            techniques rated "high utility" by Dunlosky et al. (2013). Three
            drills are available: <b>number → nāma</b>, <b>nāma → meaning</b>,
            and <b>previous → next</b>. Progress is saved in your browser; one
            card per nāma, scheduled by SM-2.
          </p>
        </header>

        <PracticeView
          names={names}
          shortMeanings={shortMeanings}
          vraviText={vraviText}
          rootText={rootText}
        />
      </section>
    </>
  );
}
