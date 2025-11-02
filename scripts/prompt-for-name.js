#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SANSKRITDOCUMENTS_PATH = path.resolve(projectRoot, 'src/commentaries-json/sanskritdocuments.json');
const PROMPTS_DIR = path.resolve(projectRoot, 'prompts');

/**
 * Extract all individual names from sanskritdocuments.json
 * @param {Object} sanskritdocumentsData
 * @returns {Array<{ number: number, devanagari: string }>}
 */
function extractNamesFromSanskritDocuments(sanskritdocumentsData) {
  /** @type {Array<{ number: number, devanagari: string }>} */
  const names = [];
  const keys = Object.keys(sanskritdocumentsData);
  
  keys.forEach((devanagari, index) => {
    names.push({
      number: index + 1,
      devanagari: devanagari,
    });
  });

  return names;
}

/**
 * Generate prompt template for a name
 * @param {number} nameNumber
 * @param {string} devanagari
 * @returns {string}
 */
function generatePrompt(nameNumber, devanagari) {
  return `## TASK

**Please analyze the Sanskrit name below from the Lalita Sahasranama and provide a complete ROOT BREAKDOWN analysis.**

Break down the name into its constituent parts, identify the root (dhātu) for each component, and provide essential meanings. Focus on meanings rather than detailed grammatical analysis. Follow all the rules and requirements listed below.

## CONTEXT

This name is from the **Lalita Sahasranama** (ललिता सहस्रनाम), a sacred Hindu text containing 1000 names of the Goddess Lalita Tripurasundari. The analysis should consider the spiritual and devotional context of this text.

## OUTPUT FORMAT

**You must return your response as plain text in ROW FORMAT using arrow notation:**

- **CRITICAL: Format each answer as a separate row/line**
- One word breakdown per row
- Each row should follow the format: [sanskrit_name] -> [meaning in english] + [meaning in english] + ...
- Use arrows (->) to separate word from meanings
- Use plus signs (+) to separate multiple meanings
- All meanings must be in English
- Focus on essential meanings only - avoid detailed grammatical analysis
- Use simple plain text lines
- No headers or markdown structure
- Just the breakdown text itself, one per row

**Format each word breakdown as a single row:**
[sanskrit_name] -> [meaning in english] + [meaning in english] + [meaning in english]

**For compound words, show the compound and its meanings:**
[compound] -> [meaning1] + [meaning2] + [combined meaning]

**For individual words, show all meanings:**
[word] -> [meaning1] + [meaning2] + [meaning3]

**Return only the breakdown text content in rows (no headers, no markdown sections, just plain text rows with arrow notation).**

---

## Name to analyze:

${devanagari}  
॥ ${nameNumber} ॥

---

**MANDATORY REQUIREMENTS**:

1. **No compound left unbroken** — go to **dhātu level**  
2. **Provide meanings in English** — all meanings must be in English  
3. **Full breakdown must be provided in plain text format**  
4. **CRITICAL: Format answers in ROWS using arrow notation** — each word breakdown must be on its own row/line  
5. **Focus on essential meanings only** — avoid detailed grammatical analysis like samāsa type, sandhi details, pratyaya specifics, grammatical class, etc.  
6. **Format:** [sanskrit_name] -> [meaning in english] + [meaning in english] + [meaning in english] (all on one line/row)  
7. **Use plus signs (+) to separate multiple meanings** — do NOT use commas, use plus signs only  
8. **All roots must be verifiable in standard Sanskrit grammar (Pāṇini, Siddhānta-kaumudī, etc.)**
9. **Break down every compound word** into its constituent parts
10. **Return ONLY the breakdown text in rows - no headers, no markdown sections, just plain text rows**

---
`;
}

/**
 * Find name by number or devanagari
 * @param {Array<{ number: number, devanagari: string }>} names
 * @param {string} query
 * @returns {{ number: number, devanagari: string } | null}
 */
function findName(names, query) {
  const queryLower = query.toLowerCase().trim();
  
  // Try as number first
  const number = parseInt(queryLower, 10);
  if (!isNaN(number) && number > 0 && number <= names.length) {
    return names.find(n => n.number === number) || null;
  }
  
  // Try to match devanagari (case-insensitive partial match)
  const devanagariMatch = names.find(n => 
    n.devanagari.toLowerCase().includes(queryLower) ||
    queryLower.includes(n.devanagari.toLowerCase())
  );
  if (devanagariMatch) {
    return devanagariMatch;
  }
  
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node scripts/prompt-for-name.js <name_number|devanagari>
   or: npm run prompt <name_number|devanagari>

Examples:
  node scripts/prompt-for-name.js 1
  node scripts/prompt-for-name.js 100
  node scripts/prompt-for-name.js श्रीमाता

Options:
  --list, -l          List all available names
  --generate, -g      Generate all prompt files first
`);
    process.exit(0);
  }

  try {
    const sanskritdocumentsData = JSON.parse(await fs.readFile(SANSKRITDOCUMENTS_PATH, 'utf8'));
    const names = extractNamesFromSanskritDocuments(sanskritdocumentsData);

    // Handle special flags
    if (args[0] === '--list' || args[0] === '-l') {
      console.log(`\nAvailable names (${names.length} total):\n`);
      names.slice(0, 20).forEach(n => {
        console.log(`  ${String(n.number).padStart(3)}: ${n.devanagari}`);
      });
      if (names.length > 20) {
        console.log(`  ... and ${names.length - 20} more\n`);
      }
      process.exit(0);
    }

    if (args[0] === '--generate' || args[0] === '-g') {
      console.log('Generating all prompt files...');
      try {
        await fs.mkdir(PROMPTS_DIR, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }

      for (const name of names) {
        const prompt = generatePrompt(name.number, name.devanagari);
        const filename = `name-${String(name.number).padStart(3, '0')}.md`;
        const filePath = path.resolve(PROMPTS_DIR, filename);
        await fs.writeFile(filePath, prompt, 'utf8');
      }
      console.log(`✅ Generated ${names.length} prompt files in prompts/`);
      process.exit(0);
    }

    // Find the requested name
    const query = args[0];
    if (!query) {
      console.error(`❌ Please provide a name to search for`);
      process.exit(1);
    }
    const name = findName(names, query);

    if (!name) {
      console.error(`❌ Name not found: "${query}"`);
      console.log(`\nUse --list to see all available names`);
      process.exit(1);
    }

    // Check if prompt file exists, otherwise generate on-the-fly
    const filename = `name-${String(name.number).padStart(3, '0')}.md`;
    const filePath = path.resolve(PROMPTS_DIR, filename);
    
    let prompt;
    try {
      prompt = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      // File doesn't exist, generate it on-the-fly
      prompt = generatePrompt(name.number, name.devanagari);
    }

    // Output the prompt
    console.log(prompt);

    // Copy to clipboard (macOS)
    try {
      const platform = process.platform;
      if (platform === 'darwin') {
        execSync('pbcopy', { input: prompt });
        console.log('\n✅ Prompt copied to clipboard!');
      } else if (platform === 'linux') {
        // Try xclip first, then wl-copy
        try {
          execSync('xclip -sel clip', { input: prompt });
          console.log('\n✅ Prompt copied to clipboard!');
        } catch {
          try {
            execSync('wl-copy', { input: prompt });
            console.log('\n✅ Prompt copied to clipboard!');
          } catch {
            console.log('\n⚠️  Clipboard not available. Install xclip or wl-clipboard for Linux.');
          }
        }
      } else {
        console.log('\n⚠️  Clipboard copy not supported on this platform.');
      }
    } catch (clipboardError) {
      // Silently fail if clipboard copy doesn't work
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error:', errorMessage);
    process.exitCode = 1;
  }
}

main();

