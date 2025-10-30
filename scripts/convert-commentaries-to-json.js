import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const COMMENTARIES_DIR = path.resolve(projectRoot, 'src/commentaries');
const COMMENTARIES_JSON_DIR = path.resolve(projectRoot, 'src/commentaries-json');

/**
 * Devanagari numerals to Arabic conversion
 */
const DEVANAGARI_NUMERALS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5',
  '६': '6', '७': '7', '८': '8', '९': '9',
};

/**
 * Convert Devanagari number to Arabic
 * @param {string} str
 * @returns {number | null}
 */
function devanagariToNumber(str) {
  // Handle multi-digit numbers like १०, ११, etc.
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char && char in DEVANAGARI_NUMERALS) {
      result += DEVANAGARI_NUMERALS[/** @type {keyof typeof DEVANAGARI_NUMERALS} */ (char)];
    }
  }
  return result ? Number(result) : null;
}

/**
 * Parse commentaries from a commentary text file
 * Format: [Number]. [Devanagari name] - [English commentary]
 * Number can be Devanagari (१२३...) or Arabic (123...)
 * Commentary may span multiple lines (continuation lines are indented)
 * Note: File may have a preamble, so we need to find where actual commentaries start
 * @param {string} commentaryText
 * @returns {Record<string, string>} Object with Sanskrit names (Devanagari) as keys and commentaries as values
 */
function parseCommentaries(commentaryText) {
  /** @type {Record<string, string>} */
  const commentaries = {};
  
  const lines = commentaryText.split('\n');
  let currentSanskritName = null;
  let currentCommentary = [];
  let foundFirstEntry = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    const trimmed = line.trim();
    
    // Skip empty lines if we haven't found the first entry yet
    if (!foundFirstEntry && !trimmed) continue;
    
    // Check for name number pattern: [Number]. [Sanskrit name] - [optional commentary]
    // This marks the start of actual commentaries
    // Supports both Devanagari numerals (१२३...) and Arabic numerals (123...)
    // Pattern is more flexible: dash may or may not be present, and Sanskrit name may be followed by dash and commentary
    const numberMatch = /^([१२३४५६७८९०]+|\d+)\.\s*(.+?)(?:\s*-\s*(.*))?$/.exec(trimmed);
    if (numberMatch) {
      const namePart = (numberMatch[2] || '').trim();
      
      // Only process if this looks like a Sanskrit name entry (contains Devanagari characters)
      // Skip if it's just English text (like continuation lines that might match the pattern)
      if (namePart && /[\u0900-\u097F]/.test(namePart)) {
        foundFirstEntry = true;
        
        // Save previous commentary
        if (currentSanskritName && currentCommentary.length > 0) {
          const commentary = currentCommentary.join(' ').trim();
          if (commentary) {
            commentaries[currentSanskritName] = commentary;
          }
        }
        
        // Extract Sanskrit name (the text between number and dash, or just after number if no dash)
        const sanskritName = namePart.trim();
        currentSanskritName = sanskritName;
        currentCommentary = [];
        
        // Extract commentary text after the dash (if any on same line)
        const afterDash = (numberMatch[3] || '').trim();
        if (afterDash) {
          currentCommentary.push(afterDash);
        }
        // The commentary might be on the next line, so we'll wait for it
        continue;
      }
    }
    
    // Only process if we've found the first entry (skip preamble)
    if (!foundFirstEntry) continue;
    
    // Continuation of current commentary
    // If we have a current name and this line is not empty and doesn't start with a number (Devanagari or Arabic)
    // Check for verse number pattern: either Devanagari numbers or Arabic numbers followed by a dot
    if (currentSanskritName && trimmed && !trimmed.match(/^([१२३४५६७८९०]+|\d+)\./)) {
      currentCommentary.push(trimmed);
    }
  }
  
  // Save last commentary
  if (currentSanskritName && currentCommentary.length > 0) {
    const commentary = currentCommentary.join(' ').trim();
    if (commentary) {
      commentaries[currentSanskritName] = commentary;
    }
  }
  
  return commentaries;
}

async function main() {
  try {
    // Ensure commentaries-json directory exists
    await fs.mkdir(COMMENTARIES_JSON_DIR, { recursive: true });

    // List all .txt files in commentaries directory
    const files = await fs.readdir(COMMENTARIES_DIR);
    const txtFiles = files.filter(f => f.endsWith('.txt'));

    console.log(`Found ${txtFiles.length} commentary files to process:`);
    
    let totalCommentaries = 0;

    for (const txtFile of txtFiles) {
      const txtPath = path.resolve(COMMENTARIES_DIR, txtFile);
      const baseName = path.basename(txtFile, '.txt');
      const jsonPath = path.resolve(COMMENTARIES_JSON_DIR, `${baseName}.json`);

      try {
        // Read the commentary file
        const commentaryText = await fs.readFile(txtPath, 'utf8');
        
        // Parse commentaries
        const commentaries = parseCommentaries(commentaryText);
        
        const count = Object.keys(commentaries).length;
        totalCommentaries += count;

        // Write JSON file
        await fs.writeFile(
          jsonPath,
          JSON.stringify(commentaries, null, 2) + '\n',
          'utf8'
        );

        console.log(`  ✓ ${txtFile} → ${baseName}.json (${count} commentaries)`);
      } catch (err) {
        console.error(`  ✗ Error processing ${txtFile}: ${err.message}`);
      }
    }

    console.log(`\nTotal commentaries processed: ${totalCommentaries}`);
    console.log(`JSON files written to: ${path.relative(projectRoot, COMMENTARIES_JSON_DIR)}`);
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  }
}

main();

