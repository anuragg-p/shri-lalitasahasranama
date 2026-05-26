import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import React from "react";
import { extractLede, splitIntoParagraphs } from "@/lib/format-commentary";

const vraviJsonPath = path.join(
  process.cwd(),
  "src/commentaries-json/vravi.json",
);

const vraviCommentaries = JSON.parse(
  fs.readFileSync(vraviJsonPath, "utf-8"),
) as Record<string, string>;

const entries = Object.entries(vraviCommentaries);

export const metadata = {
  title: "V. Ravi Commentaries — Lalita Sahasranama",
  description:
    "All 1000 names of the Lalita Sahasranama with V. Ravi's commentary.",
};

export default function VRaviPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 text-center">
        <p className="mb-3">
          <Link
            href="/"
            className="text-sm font-semibold text-[#c2410c] hover:text-[#7c1d1d]"
          >
            ← back to verses
          </Link>
        </p>
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-[#2b1700]">
          V. Ravi Commentaries
        </h1>
        <hr className="paper-rule mx-auto w-48" />
        <p className="mt-3 text-sm text-[#5a3a18]">
          All {entries.length} names of the Lalita Sahasranama with V. Ravi&rsquo;s
          commentary.
        </p>
      </header>

      <div className="space-y-12 text-left leading-relaxed">
        {entries.map(([name, commentary], idx) => {
          const flatText = commentary.replace(/\s+/g, " ").trim();
          const { lede, body } = extractLede(flatText);
          const paragraphs = splitIntoParagraphs(body || flatText);

          return (
            <article
              key={`${idx}-${name}`}
              id={`name-${idx + 1}`}
              className="scroll-mt-8 border-b border-[#2b1700]/10 pb-10 last:border-b-0"
            >
              <h2 className="mb-4 flex items-baseline gap-3">
                <span className="font-mono text-sm text-[#8a6a3c]">
                  {String(idx + 1).padStart(3, "0")}.
                </span>
                <span className="font-sanskrit text-3xl font-bold text-[#7c1d1d]">
                  {name}
                </span>
              </h2>

              {lede && <p className="commentary-lede">{lede}</p>}

              <div className="commentary-body space-y-4 text-base text-[#2b1700]/85">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
