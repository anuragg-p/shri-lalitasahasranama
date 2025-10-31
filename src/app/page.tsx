import fs from "node:fs";
import path from "node:path";
import React from "react";
import VersesDisplay from "./verses-display";

const sanskritFilePath = path.join(process.cwd(), "src/constants/sanskrit.txt");
const sanskritText = fs.readFileSync(sanskritFilePath, "utf-8");

// Load all three commentaries
const loadCommentary = (filename: string): Record<string, string> => {
  const filePath = path.join(process.cwd(), `src/commentaries-json/${filename}`);
  const text = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(text) as Record<string, string>;
};

const commentaries = {
  "Bhaskaraya": loadCommentary("bhaskaraya.json"),
  "V. Ravi": loadCommentary("vravi.json"),
  "Sanskrit Documents": loadCommentary("sanskritdocuments.json"),
};

export default function Home() {
  return (
    <div className="container mx-auto bg-[#412100] px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">
        Lalita Sahasranama
      </h1>
      <VersesDisplay sanskritText={sanskritText} commentaries={commentaries} />
    </div>
  );
}