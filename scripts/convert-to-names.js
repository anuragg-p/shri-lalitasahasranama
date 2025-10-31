import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SANSKRIT_PATH = path.resolve(projectRoot, 'src/constants/sanskrit.txt');
const COMMENTARIES_MD_PATH = path.resolve(projectRoot, 'src/constants/commentaries.md');
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
  let isFirstLine = true;

  // Function to check if a token contains only numerals (Devanagari or Arabic)
  /**
   * @param {string} token
   * @returns {boolean}
   */
  function isOnlyNumerals(token) {
    const cleaned = token.trim();
    if (!cleaned) return true;
    // Check if all characters are either Devanagari or Arabic numerals
    return /^[०-९\d]+$/.test(cleaned);
  }

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Remove all content in parentheses (both alternate readings and verse numbers like (1), (दशनच्छदा))
    const cleaned = trimmed
      .replace(/\([^)]*\)/g, '')  // Remove all parenthetical content
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) continue;

    // Split by spaces to get individual names
    const tokens = cleaned.split(/\s+/).filter(t => t && t.length > 0);

    for (const token of tokens) {
      // Special case: Skip the first word "ॐ" (Om)
      if (isFirstLine && token === 'ॐ') {
        isFirstLine = false;
        continue;
      }
      
      // Mark that we've processed the first line
      if (isFirstLine) {
        isFirstLine = false;
      }

      // Skip very short tokens that are likely punctuation
      // Skip tokens that are only numerals (Devanagari or Arabic)
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

---${commentariesSections}

---
`;
}

async function main() {
  try {
    // Read sanskrit.txt
    const sanskritText = await fs.readFile(SANSKRIT_PATH, 'utf8');
    const names = extractNamesFromSanskrit(sanskritText);

    console.log(`Extracted ${names.length} names from sanskrit.txt`);
    
    // Note: The file may contain fewer than 1000 names if it's incomplete
    // This is informational, not an error
    if (names.length === 1000) {
      console.log('✅ Verified: Exactly 1000 names extracted');
    } else if (names.length > 0) {
      console.log(`ℹ️  Info: Extracted ${names.length} names (expected 1000 if file is complete)`);
    }

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

    // Write to commentaries.md
    const output = entries.join('\n\n');
    await fs.writeFile(COMMENTARIES_MD_PATH, output, 'utf8');

    console.log(`\nGenerated ${entries.length} NAME entries in ${path.relative(projectRoot, COMMENTARIES_MD_PATH)}`);
    console.log(`First few names: ${names.slice(0, 5).map(n => n.devanagari).join(', ')}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error:', errorMessage);
    process.exitCode = 1;
  }
}

main();

