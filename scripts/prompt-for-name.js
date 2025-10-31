#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SANSKRIT_PATH = path.resolve(projectRoot, 'src/constants/sanskrit.txt');
const PROMPTS_DIR = path.resolve(projectRoot, 'prompts');

/**
 * Extract all individual names from sanskrit.txt
 * @param {string} sanskritText
 * @returns {Array<{ number: number, devanagari: string }>}
 */
function extractNamesFromSanskrit(sanskritText) {
  const lines = sanskritText.split('\n');
  const names = [];
  let nameNumber = 1;
  let isFirstLine = true;

  /**
   * @param {string} token
   * @returns {boolean}
   */
  function isOnlyNumerals(token) {
    const cleaned = token.trim();
    if (!cleaned) return true;
    return /^[०-९\d]+$/.test(cleaned);
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const cleaned = trimmed
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) continue;

    const tokens = cleaned.split(/\s+/).filter(t => t && t.length > 0);

    for (const token of tokens) {
      if (isFirstLine && token === 'ॐ') {
        isFirstLine = false;
        continue;
      }
      
      if (isFirstLine) {
        isFirstLine = false;
      }

      if (token.length >= 2 && !isOnlyNumerals(token)) {
        names.push({
          number: nameNumber++,
          devanagari: token,
        });
      }
    }
  }

  return names;
}

/**
 * Generate prompt template for a name
 * @param {number} nameNumber
 * @param {string} devanagari
 * @param {string} iast
 * @returns {string}
 */
function generatePrompt(nameNumber, devanagari, iast) {
  return `## TASK

**Please analyze the Sanskrit name below and provide a complete ROOT BREAKDOWN analysis.**

Break down the name into its constituent parts, identify all grammatical elements (sandhi, components, roots), and provide both literal and contextual meanings. Follow all the rules and requirements listed below.

## OUTPUT FORMAT

**You must return your response in Markdown format (.md) with the following structure:**

1. Start with the name header: \`# NAME <number>\`
2. Include the name in Devanagari and IAST (if available)
3. Fill in the ROOT BREAKDOWN table with complete analysis
4. Replace all placeholder text (e.g., \`[root1] + [root2]\`, \`[morphology]\`) with actual values
5. Ensure the table is valid Markdown
6. Provide complete information for each column: Compound, Sandhi, Components, Grammar, Literal, Contextual

**Return only the completed markdown content, starting from \`# NAME <number>\` through the filled ROOT BREAKDOWN table.**

---

# NAME ${nameNumber}

> ${devanagari}  
> ${iast}  
> ॥ ${nameNumber} ॥

---

## ROOT BREAKDOWN

| Compound | Sandhi | Components | Grammar | Literal | Contextual |
|----------|--------|------------|---------|---------|------------|
| ${devanagari} | — | [root1] + [root2] + … | [morphology] | [word-for-word] | [in name] |

> **Rules**:  
> - \`Components\` = upasarga + dhātu + kṛt/taddhita + pratyaya  
> - \`Grammar\` = √class-gender-case-number-form (e.g. \`√1P-f-nom-sg-PPP\`)  
> - \`Sandhi\` = specific rule applied (or \`—\` if none)

---

**MANDATORY REQUIREMENTS**:

1. **No compound left unbroken** — go to **dhātu level**  
2. **Include sandhi** even if minimal  
3. **Use IAST** for all transliteration  
4. **All tables must be valid Markdown**  
5. **All roots must be verifiable in standard Sanskrit grammar (Pāṇini, Siddhānta-kaumudī, etc.)**
6. **Break down every compound word** into its constituent parts

---
`;
}

/**
 * Get IAST transliteration (placeholder)
 * @param {string} devanagari
 * @returns {string}
 */
function getIAST(devanagari) {
  return devanagari;
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
    const sanskritText = await fs.readFile(SANSKRIT_PATH, 'utf8');
    const names = extractNamesFromSanskrit(sanskritText);

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
        const iast = getIAST(name.devanagari);
        const prompt = generatePrompt(name.number, name.devanagari, iast);
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
      const iast = getIAST(name.devanagari);
      prompt = generatePrompt(name.number, name.devanagari, iast);
    }

    // Output the prompt
    console.log(prompt);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error:', errorMessage);
    process.exitCode = 1;
  }
}

main();

