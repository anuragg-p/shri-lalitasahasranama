import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SANSKRIT_PATH = path.resolve(projectRoot, 'src/constants/sanskrit.txt');
const MEANINGS_MD_PATH = path.resolve(projectRoot, 'src/constants/meanings.md');
const COMMENTARIES_JSON_DIR = path.resolve(projectRoot, 'src/commentaries-json');

/**
 * Extract all individual names from sanskrit.txt
 * @param {string} sanskritText
 * @returns {Array<{ number: number, devanagari: string }>}
 */
function extractNamesFromSanskrit(sanskritText) {
  const lines = sanskritText.split('\n');
  const names = [];
  let nameNumber = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('॥') || /^इति/.test(trimmed)) {
      continue;
    }

    // Remove verse numbers and dandas
    const cleaned = trimmed
      .replace(/॥\s*\d+\s*॥/g, '')
      .replace(/[।]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) continue;

    // Split by spaces to get individual names
    const tokens = cleaned.split(/\s+/).filter(t => t && t.length > 0);

    for (const token of tokens) {
      // Skip very short tokens that are likely punctuation
      if (token.length >= 2) {
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
 * Get IAST transliteration for a name (placeholder - would need actual converter)
 * @param {string} devanagari
 * @returns {string}
 */
function getIAST(devanagari) {
  // For now, return placeholder - this would need proper transliteration
  return devanagari; // Placeholder
}

/**
 * Convert filename to section title (e.g., "sanskritdocuments.json" -> "SANSKRITDOCUMENTS")
 * @param {string} filename
 * @returns {string}
 */
function filenameToSectionTitle(filename) {
  return path.basename(filename, '.json').toUpperCase().replace(/-/g, ' ');
}

/**
 * Find commentary for a Sanskrit name, trying with and without dashes
 * @param {Record<string, string>} commentaries
 * @param {string} devanagari
 * @returns {string}
 */
function findCommentary(commentaries, devanagari) {
  // First try exact match
  if (commentaries[devanagari]) {
    return commentaries[devanagari];
  }
  
  // If not found, try without dashes
  const withoutDashes = devanagari.replace(/-/g, '');
  if (withoutDashes !== devanagari && commentaries[withoutDashes]) {
    return commentaries[withoutDashes];
  }
  
  return '';
}

/**
 * Generate a NAME entry template
 * @param {number} nameNumber
 * @param {string} devanagari
 * @param {string} iast
 * @param {Record<string, Record<string, string>>} commentariesByFile - Object mapping filename to commentaries object
 * @returns {string}
 */
function generateNameEntry(nameNumber, devanagari, iast, commentariesByFile) {
  let commentariesSections = '';
  
  // Generate COMMENTARIES section for each JSON file
  const jsonFiles = Object.keys(commentariesByFile).sort();
  
  if (jsonFiles.length > 0) {
    for (const jsonFile of jsonFiles) {
      const commentaries = commentariesByFile[jsonFile];
      if (!commentaries) continue;
      const sectionTitle = filenameToSectionTitle(jsonFile);
      const commentary = findCommentary(commentaries, devanagari);
      
      commentariesSections += `\n\n## COMMENTARIES (${sectionTitle})\n\n`;
      
      if (commentary) {
        commentariesSections += `> **${devanagari}** — ${commentary}\n`;
      } else {
        commentariesSections += `> [Needs commentary]\n`;
      }
    }
  }
  
  return `# NAME ${nameNumber}

> ${devanagari}  
> ${iast}  
> ॥ ${nameNumber} ॥

---

## ROOT BREAKDOWN

| Compound | Sandhi | Components | Grammar | Literal | Contextual |
|----------|--------|------------|---------|---------|------------|
| ${devanagari} | — | — | — | — | — |

---

## ETYMOLOGY (DETAILED)

### ${devanagari}
- **Breakdown**: \`${devanagari}\`  
- **Root (Dhātu)**: —  
- **Upasarga(s)**: none  
- **Suffix**: —  
- **Sandhi**: —  
- **Formation**: —  
- **Grammar**: —  
- **Meaning**:  
  - **Literal**: ""  
  - **Contextual**: ""

---

## COMPOSITIONS

This name [needs composition summary].

**Word-by-word meaning**:
* **${devanagari}** — [needs meaning]${commentariesSections}
---

`;
}

async function main() {
  try {
    // Read sanskrit.txt
    const sanskritText = await fs.readFile(SANSKRIT_PATH, 'utf8');
    const names = extractNamesFromSanskrit(sanskritText);

    console.log(`Extracted ${names.length} names from sanskrit.txt`);

    // Read all JSON files from commentaries-json directory
    /** @type {Record<string, Record<string, string>>} */
    const commentariesByFile = {};
    
    try {
      const files = await fs.readdir(COMMENTARIES_JSON_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      console.log(`Found ${jsonFiles.length} commentary JSON files`);
      
      for (const jsonFile of jsonFiles) {
        const jsonPath = path.resolve(COMMENTARIES_JSON_DIR, jsonFile);
        try {
          const jsonContent = await fs.readFile(jsonPath, 'utf8');
          const commentaries = JSON.parse(jsonContent);
          
          if (Object.keys(commentaries).length > 0) {
            commentariesByFile[jsonFile] = commentaries;
            console.log(`  ✓ Loaded ${Object.keys(commentaries).length} commentaries from ${jsonFile}`);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.warn(`  ✗ Could not read ${jsonFile}: ${errorMessage}`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`Could not read commentaries directory: ${errorMessage}`);
    }

    // Generate markdown entries
    const entries = names.map(name => {
      return generateNameEntry(
        name.number,
        name.devanagari,
        getIAST(name.devanagari),
        commentariesByFile
      );
    });

    // Write to meanings.md
    const output = entries.join('\n\n');
    await fs.writeFile(MEANINGS_MD_PATH, output, 'utf8');

    console.log(`\nGenerated ${entries.length} NAME entries in ${MEANINGS_MD_PATH}`);
    console.log(`First few names: ${names.slice(0, 5).map(n => n.devanagari).join(', ')}`);
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  }
}

main();

