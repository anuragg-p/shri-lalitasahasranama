import fs from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

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

async function main() {
  try {
    // Read sanskritdocuments.json
    const sanskritdocumentsData = JSON.parse(await fs.readFile(SANSKRITDOCUMENTS_PATH, 'utf8'));
    const names = extractNamesFromSanskritDocuments(sanskritdocumentsData);

    console.log(`Extracted ${names.length} names from sanskritdocuments.json`);
    
    if (names.length !== 1000) {
      console.warn(`⚠️  Warning: Expected 1000 names, but found ${names.length}`);
    }

    // Create prompts directory if it doesn't exist
    try {
      await fs.mkdir(PROMPTS_DIR, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore
    }

    // Generate prompts
    let successCount = 0;
    let errorCount = 0;

    for (const name of names) {
      try {
        const prompt = generatePrompt(name.number, name.devanagari);
        const filename = `name-${String(name.number).padStart(3, '0')}.md`;
        const filePath = path.resolve(PROMPTS_DIR, filename);
        
        await fs.writeFile(filePath, prompt, 'utf8');
        successCount++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Error generating prompt for name ${name.number}: ${errorMessage}`);
        errorCount++;
      }
    }

    console.log(`\n✅ Generated ${successCount} prompt files in ${path.relative(projectRoot, PROMPTS_DIR)}/`);
    if (errorCount > 0) {
      console.warn(`⚠️  ${errorCount} errors occurred`);
    }
    console.log(`\nExample: ${path.relative(projectRoot, PROMPTS_DIR)}/name-001.md`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error:', errorMessage);
    process.exitCode = 1;
  }
}

main();

