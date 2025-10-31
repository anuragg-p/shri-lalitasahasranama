import fs from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const INPUT_PATH = path.resolve(projectRoot, 'src/constants/meanings.json');
const OUTPUT_MEANINGS_PATH = path.resolve(projectRoot, 'src/constants/meanings.json');
const OUTPUT_COMMENTARIES_PATH = path.resolve(projectRoot, 'src/constants/commentaries.json');

async function main() {
  try {
    // Read existing meanings.json
    const raw = await fs.readFile(INPUT_PATH, 'utf8');
    /** @type {Array<any>} */
    const names = JSON.parse(raw);

    console.log(`Loaded ${names.length} names from meanings.json`);

    // Split into meanings (root breakdown only) and commentaries
    /** @type {Array<{ nameNumber: number | null, name: { devanagari: string, iast: string, tokens: string[] }, rootBreakdown: any[] }>} */
    const meanings = names.map((item) => ({
      nameNumber: item.nameNumber ?? null,
      name: item.name || { devanagari: '', iast: '', tokens: [] },
      rootBreakdown: item.rootBreakdown || [],
    }));

    /** @type {Record<string, Record<string, { author: string, period: string, text: string, source: string }>>} */
    const commentaries = {};
    
    for (const item of names) {
      const devanagari = item.name?.devanagari || '';
      if (!devanagari) continue;
      
      // Consolidate all commentaries for this name
      commentaries[devanagari] = item.commentaries || {};
    }

    // Write meanings.json (only root breakdown data)
    await fs.writeFile(OUTPUT_MEANINGS_PATH, JSON.stringify(meanings, null, 2) + '\n', 'utf8');
    console.log(`✓ Wrote ${meanings.length} meanings to ${path.relative(projectRoot, OUTPUT_MEANINGS_PATH)}`);

    // Write commentaries.json (all commentaries consolidated)
    await fs.writeFile(OUTPUT_COMMENTARIES_PATH, JSON.stringify(commentaries, null, 2) + '\n', 'utf8');
    console.log(`✓ Wrote ${Object.keys(commentaries).length} commentaries to ${path.relative(projectRoot, OUTPUT_COMMENTARIES_PATH)}`);
    
    console.log('\n✅ Successfully split meanings.json into two files!');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error:', errorMessage);
    process.exitCode = 1;
  }
}

main();

