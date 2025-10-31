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
 * Get IAST transliteration (placeholder - can be enhanced with actual converter)
 * @param {string} devanagari
 * @returns {string}
 */
function getIAST(devanagari) {
  // Placeholder - return devanagari for now
  // TODO: Add proper IAST transliteration
  return devanagari;
}

async function main() {
  try {
    // Read sanskrit.txt
    const sanskritText = await fs.readFile(SANSKRIT_PATH, 'utf8');
    const names = extractNamesFromSanskrit(sanskritText);

    console.log(`Extracted ${names.length} names from sanskrit.txt`);
    
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
        const iast = getIAST(name.devanagari);
        const prompt = generatePrompt(name.number, name.devanagari, iast);
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

