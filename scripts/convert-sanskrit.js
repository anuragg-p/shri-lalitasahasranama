import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const INPUT_RELATIVE_PATH = 'src/constants/sanskrit.txt';
const OUTPUT_RELATIVE_PATH = 'src/constants/verses.md';

const SECTION_TEMPLATE = [
  '## ROOT',
  '',
  '## COMPOSITIONS',
  '',
  '## COMMENTARY (BHĀSKARARĀYA)',
  '',
  '## COMMENTARY (V. RAVI)',
  '',
  '## COMMENTARY (Sanskrit Documents)',
  '',
];

function buildVerseSection(verseText, index) {
  const verseLines = verseText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

  const parts = [`# VERSE ${index + 1}`, verseLines, '', ...SECTION_TEMPLATE];

  return parts.join('\n');
}

async function ensureFileExists(filePath) {
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`Cannot find file at ${filePath}.`);
  }
}

async function main() {
  const inputPath = path.resolve(projectRoot, INPUT_RELATIVE_PATH);
  const outputPath = path.resolve(projectRoot, OUTPUT_RELATIVE_PATH);

  await ensureFileExists(inputPath);

  const rawText = await fs.readFile(inputPath, 'utf8');

  const verses = rawText
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (verses.length === 0) {
    throw new Error('No verses found in the input file.');
  }

  const markdown = verses.map(buildVerseSection).join('\n\n');

  await fs.writeFile(outputPath, `${markdown}\n`, 'utf8');

  console.log(
    `Converted ${verses.length} verses from ${path.relative(projectRoot, inputPath)} to ${path.relative(
      projectRoot,
      outputPath,
    )}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
