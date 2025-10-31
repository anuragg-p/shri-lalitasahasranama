import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const VRAVI_COPY2_PATH = path.resolve(projectRoot, 'src/misc/vravi copy 2.txt');
const SANSKRITDOCUMENTS_PATH = path.resolve(projectRoot, 'src/commentaries-json/sanskritdocuments.json');
const MEANINGS_JSON_PATH = path.resolve(projectRoot, 'src/misc/vravi-copy2-meanings.json');
const OUTPUT_VRAVI_PATH = path.resolve(projectRoot, 'src/commentaries/vravi.txt');

/**
 * Parse vravi copy 2.txt and extract name number to meaning mapping
 * Entry format: <number>. <Sanskrit/IAST> <Devanagari>
 * @param {string} content
 * @returns {Record<string, string>} Object with name number as key and meaning as value
 */
function parseMeanings(content) {
  /** @type {Record<string, string>} */
  const meanings = {};
  
  const lines = content.split('\n');
  let currentNumber = null;
  /** @type {string[]} */
  let currentMeaning = [];
  let previousLineWasEmpty = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    const trimmed = line.trim();
    const previousLine = i > 0 ? lines[i - 1] || '' : '';
    const prevLineWasEmpty = previousLine.trim() === '';
    
    // Check if this line starts a new entry: "[Number]. [IAST with spaces] [Devanagari]"
    // Entry format: <number><dot> <IAST> <SANSKRIT>
    // Must have empty line above it (except for first entry)
    const entryMatch = /^(\d+)\.\s+(.+)$/.exec(line);
    
    if (entryMatch) {
      const afterNumber = entryMatch[2] || '';
      const trimmedAfter = afterNumber.trim();
      
      // Entry lines should:
      // 1. Have empty line above (except first entry at start of file)
      // 2. Contain IAST text (with spaces) followed by Devanagari, OR only Devanagari
      // 3. Pattern: IAST text (can have spaces, Latin chars with diacritics) then Devanagari, OR just Devanagari
      const hasIASTWithSpaces = /[A-Za-zāīūṛēōṃḥśṣṇṭḍṅĀĪŪṚĒŌṂḤŚṢṆṬḌÑṅŚ][\sA-Za-zāīūṛēōṃḥśṣṇṭḍṅĀĪŪṚĒŌṂḤŚṢṆṬḌÑṅŚ-]*[\u0900-\u097F]/.test(trimmedAfter);
      const onlyDevanagari = /^[\u0900-\u097F\s-]+$/.test(trimmedAfter);
      const hasDevanagari = /[\u0900-\u097F]/.test(trimmedAfter);
      const endsWithDevanagari = /[\u0900-\u097F]\s*$/.test(trimmedAfter);
      
      // Check for English words AFTER the name - if found, it's NOT an entry (it's a numbered list)
      const hasEnglishAfterName = /[\u0900-\u097F]\s+(the|a|an|is|are|was|were|of|in|on|at|to|for|with|comprising|science|treatise|means|which|that|represented|ascribed)/i.test(trimmedAfter);
      
      // It's a valid entry if:
      // - It's the first line of file OR has empty line above it, AND
      // - (It has IAST text with spaces followed by Devanagari, OR only Devanagari), AND
      // - It ends with Devanagari, AND
      // - It does NOT have English words after the Devanagari
      const isFirstLine = i === 0;
      const hasValidNameFormat = hasIASTWithSpaces || onlyDevanagari;
      if ((isFirstLine || prevLineWasEmpty) && hasValidNameFormat && hasDevanagari && endsWithDevanagari && !hasEnglishAfterName) {
        // Save previous entry if exists
        if (currentNumber !== null && currentMeaning.length > 0) {
          const meaning = currentMeaning.join(' ').trim();
          if (meaning) {
            meanings[String(currentNumber)] = meaning;
          }
        }
        
        // Start new entry
        currentNumber = entryMatch[1];
        currentMeaning = [];
        previousLineWasEmpty = false;
        continue;
      }
    }
    
    // Track if this line is empty
    if (!trimmed) {
      previousLineWasEmpty = true;
    } else {
      previousLineWasEmpty = false;
    }
    
    // If we have a current number, collect meaning lines
    if (currentNumber !== null && trimmed) {
      currentMeaning.push(trimmed);
    }
  }
  
  // Save last entry
  if (currentNumber !== null && currentMeaning.length > 0) {
    const meaning = currentMeaning.join(' ').trim();
    if (meaning) {
      meanings[String(currentNumber)] = meaning;
    }
  }
  
  return meanings;
}

/**
 * Format an entry for vravi.txt
 * Format: 
 *   [Number]. [Devanagari name]
 *   [meaning]
 * @param {number} number
 * @param {string} devanagari
 * @param {string} meaning
 * @returns {string}
 */
function formatEntry(number, devanagari, meaning) {
  if (meaning) {
    return `${number}. ${devanagari}\n${meaning}`;
  }
  return `${number}. ${devanagari}`;
}

async function main() {
  try {
    console.log('🚀 Creating vravi.txt from vravi copy 2.txt\n');
    
    // Step 1: Parse vravi copy 2.txt to create meanings JSON
    console.log(`📖 Step 1: Parsing ${path.relative(projectRoot, VRAVI_COPY2_PATH)}...`);
    const vraviCopy2Content = await fs.readFile(VRAVI_COPY2_PATH, 'utf8');
    const meanings = parseMeanings(vraviCopy2Content);
    
    console.log(`   ✓ Extracted ${Object.keys(meanings).length} meanings\n`);
    
    // Save meanings JSON
    await fs.writeFile(
      MEANINGS_JSON_PATH,
      JSON.stringify(meanings, null, 2) + '\n',
      'utf8'
    );
    console.log(`   ✓ Saved meanings to ${path.relative(projectRoot, MEANINGS_JSON_PATH)}\n`);
    
    // Step 2: Load names from sanskritdocuments.json
    console.log(`📖 Step 2: Loading names from ${path.relative(projectRoot, SANSKRITDOCUMENTS_PATH)}...`);
    const sanskritContent = await fs.readFile(SANSKRITDOCUMENTS_PATH, 'utf8');
    /** @type {Record<string, string>} */
    const sanskritDocs = JSON.parse(sanskritContent);
    
    // Get all names in order (JavaScript objects preserve insertion order)
    const devanagariNames = Object.keys(sanskritDocs);
    console.log(`   ✓ Loaded ${devanagariNames.length} names from sanskritdocuments.json\n`);
    
    // Step 3: Create vravi.txt with all 1000 entries
    console.log(`📝 Step 3: Creating ${path.relative(projectRoot, OUTPUT_VRAVI_PATH)}...`);
    const entries = [];
    
    for (let i = 0; i < 1000; i++) {
      const number = i + 1;
      const devanagari = devanagariNames[i] || '';
      const meaning = meanings[String(number)] || '';
      
      if (!devanagari) {
        console.warn(`   ⚠️  Warning: Missing name for entry ${number}`);
      }
      
      if (!meaning) {
        console.warn(`   ⚠️  Warning: Missing meaning for entry ${number}`);
      }
      
      entries.push(formatEntry(number, devanagari, meaning));
    }
    
    // Join entries with double newline (blank line between entries)
    const output = entries.join('\n\n') + '\n';
    await fs.writeFile(OUTPUT_VRAVI_PATH, output, 'utf8');
    
    const entriesWithMeanings = entries.filter(e => e.includes('\n') && e.split('\n')[1]?.trim()).length;
    console.log(`   ✓ Created vravi.txt with ${entries.length} entries (${entriesWithMeanings} with meanings)\n`);
    
    console.log('✅ Completed! vravi.txt has been created.');
    console.log(`   Output: ${path.relative(projectRoot, OUTPUT_VRAVI_PATH)}`);
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('❌ Error:', errorMessage);
    process.exitCode = 1;
  }
}

main();

