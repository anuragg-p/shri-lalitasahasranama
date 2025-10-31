import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const MEANINGS_PATH = 'src/constants/meanings.json';
const COMMENTARIES_PATH = 'src/constants/commentaries.json';
const OUTPUT_PATH = 'missing-commentaries-report.txt';

/**
 * Check if a name has any non-empty commentary
 * @param {Record<string, any>} commentaries - The commentaries object for a name
 * @returns {boolean}
 */
function hasCommentary(commentaries) {
  if (!commentaries || typeof commentaries !== 'object') {
    return false;
  }
  
  // Check all commentary sources
  for (const source of Object.values(commentaries)) {
    if (source && typeof source === 'object' && source.text !== undefined) {
      const text = String(source.text).trim();
      if (text.length > 0) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Find matching commentary entry, handling variations in Devanagari text
 * @param {string} devanagari
 * @param {Record<string, any>} commentaries
 * @returns {any}
 */
function findCommentary(devanagari, commentaries) {
  if (!devanagari || !commentaries) return null;
  
  // Direct match
  if (commentaries[devanagari]) {
    return commentaries[devanagari];
  }
  
  // Try to find by exact match ignoring case variations (though unlikely for Devanagari)
  // But more importantly, check if there are close matches
  const normalized = devanagari.trim();
  for (const key of Object.keys(commentaries)) {
    if (key.trim() === normalized) {
      return commentaries[key];
    }
  }
  
  return null;
}

async function main() {
  const meaningsPath = path.resolve(projectRoot, MEANINGS_PATH);
  const commentariesPath = path.resolve(projectRoot, COMMENTARIES_PATH);
  const outputPath = path.resolve(projectRoot, OUTPUT_PATH);

  // Read meanings.json
  const meaningsContent = await fs.readFile(meaningsPath, 'utf8');
  /** @type {Array<{ nameNumber: number | null, name: { devanagari: string, iast: string, tokens: string[] } }>} */
  const meanings = JSON.parse(meaningsContent);

  // Read commentaries.json
  let commentaries = {};
  try {
    const commentariesContent = await fs.readFile(commentariesPath, 'utf8');
    commentaries = JSON.parse(commentariesContent);
  } catch (err) {
    console.warn(`Warning: Could not read ${COMMENTARIES_PATH}: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Find names without commentaries (all sources empty or missing entirely)
  /** @type {Array<{ nameNumber: number | null, devanagari: string, iast: string, inCommentariesFile?: boolean, sources?: string[] }>} */
  const missingCommentaries = [];
  
  // Also track which names are missing from commentaries.json file entirely
  /** @type {Array<{ nameNumber: number | null, devanagari: string, iast: string }>} */
  const notInFile = [];

  for (const meaning of meanings) {
    const devanagari = meaning.name?.devanagari || '';
    if (!devanagari) {
      // Name without devanagari - still report it
      missingCommentaries.push({
        nameNumber: meaning.nameNumber,
        devanagari: '(missing devanagari)',
        iast: meaning.name?.iast || ''
      });
      continue;
    }

    const nameCommentaries = findCommentary(devanagari, commentaries);
    
    if (!nameCommentaries) {
      // Name not found in commentaries.json at all
      notInFile.push({
        nameNumber: meaning.nameNumber,
        devanagari: devanagari,
        iast: meaning.name?.iast || ''
      });
      missingCommentaries.push({
        nameNumber: meaning.nameNumber,
        devanagari: devanagari,
        iast: meaning.name?.iast || '',
        inCommentariesFile: false
      });
    } else if (!hasCommentary(nameCommentaries)) {
      // Name is in file but all commentaries are empty
      const emptySources = Object.entries(nameCommentaries)
        .filter(([_, source]) => !source?.text || String(source.text).trim() === '')
        .map(([key, _]) => key);
      
      missingCommentaries.push({
        nameNumber: meaning.nameNumber,
        devanagari: devanagari,
        iast: meaning.name?.iast || '',
        inCommentariesFile: true,
        sources: emptySources
      });
    }
  }

  // Sort by nameNumber
  missingCommentaries.sort((a, b) => {
    const numA = a.nameNumber ?? 0;
    const numB = b.nameNumber ?? 0;
    return numA - numB;
  });

  // Generate report
  let report = `NAMAS MISSING COMMENTARIES\n`;
  report += `==========================\n\n`;
  report += `Total names checked: ${meanings.length}\n`;
  report += `Unique devanagari names: ${new Set(meanings.map(m => m.name?.devanagari).filter(Boolean)).size}\n`;
  report += `Names with commentaries: ${meanings.length - missingCommentaries.length}\n`;
  report += `Names missing commentaries: ${missingCommentaries.length}\n`;
  report += `  - Not in commentaries.json: ${notInFile.length}\n`;
  report += `  - In commentaries.json but all empty: ${missingCommentaries.length - notInFile.length}\n\n`;
  report += `DETAILED LIST:\n`;
  report += `-------------\n\n`;

  if (missingCommentaries.length === 0) {
    report += `All names have at least one non-empty commentary!\n`;
  } else {
    for (const item of missingCommentaries) {
      report += `${item.nameNumber ?? 'N/A'}. ${item.devanagari}`;
      if (item.iast) {
        report += ` (${item.iast})`;
      }
      if (item.inCommentariesFile === false) {
        report += ` [NOT IN commentaries.json]`;
      } else if (item.inCommentariesFile === true && item.sources) {
        report += ` [All sources empty: ${item.sources.join(', ')}]`;
      }
      report += `\n`;
    }
  }

  // Write report
  await fs.writeFile(outputPath, report, 'utf8');
  
  console.log(`\nReport generated: ${path.relative(projectRoot, outputPath)}`);
  console.log(`Total names: ${meanings.length}`);
  console.log(`Names with commentaries: ${meanings.length - missingCommentaries.length}`);
  console.log(`Names missing commentaries: ${missingCommentaries.length}`);
  
  // Also print first 20 for quick reference
  if (missingCommentaries.length > 0) {
    console.log(`\nFirst 20 names missing commentaries:`);
    for (let i = 0; i < Math.min(20, missingCommentaries.length); i++) {
      const item = missingCommentaries[i];
      console.log(`  ${item.nameNumber ?? 'N/A'}. ${item.devanagari}`);
    }
    if (missingCommentaries.length > 20) {
      console.log(`  ... and ${missingCommentaries.length - 20} more`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

