import fs from "node:fs";
import path from "node:path";
import React from "react";
import VersesDisplay from "./verses-display";

const sanskritFilePath = path.join(process.cwd(), "src/constants/sanskrit.txt");
const sanskritText = fs.readFileSync(sanskritFilePath, "utf-8");

const commentariesFilePath = path.join(
  process.cwd(),
  "src/commentaries-json/sanskritdocuments.json"
);
const commentariesText = fs.readFileSync(commentariesFilePath, "utf-8");
const commentaries = JSON.parse(commentariesText) as Record<string, string>;

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