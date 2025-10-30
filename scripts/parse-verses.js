import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const INPUT_RELATIVE_PATH = 'src/constants/meanings.md';
const OUTPUT_RELATIVE_PATH = 'src/constants/meanings.json';
const SANSKRIT_RELATIVE_PATH = 'src/constants/sanskrit.txt';

/**
 * @param {string[]} lines
 * @returns {string[]}
 */
function trimEmptyEdges(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && ((lines[start] ?? '').trim() === '')) start++;
  while (end > start && (((lines[end - 1]) ?? '').trim() === '')) end--;
  return lines.slice(start, end);
}

/**
 * @param {string[]} lines
 * @returns {{ headers: string[], rows: Array<Record<string, string>> }}
 */
function parseMarkdownTable(lines) {
  const tableLines = [];
  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      tableLines.push(line.trim());
    } else if (tableLines.length > 0) {
      // break at first non-table line after seeing table
      break;
    }
  }
  if (tableLines.length === 0) return { headers: [], rows: [] };

  // Remove separator lines like |-----|-----|
  const cleaned = tableLines.filter((l) => !/^\|\s*-+/.test(l));
  if (cleaned.length === 0) return { headers: [], rows: [] };

  /** @param {string} row */
  const splitRow = (row) => row
    .slice(1, -1) // drop leading and trailing |
    .split('|')
    .map((c) => c.trim());

  const headerRow = cleaned[0] || '';
  const headers = splitRow(headerRow);
  const rows = cleaned.slice(1).map((r) => {
    const cells = splitRow(r);
    /** @type {Record<string, string>} */
    const obj = {};
    headers.forEach((h, i) => {
      obj[h || `col_${i + 1}`] = cells[i] ?? '';
    });
    return obj;
  });

  return { headers, rows };
}

/**
 * @param {string[]} lines
 * @param {number} startIdx
 * @param {number} endIdx
 * @returns {string[]}
 */
function sliceBetween(lines, startIdx, endIdx) {
  return lines.slice(startIdx, endIdx);
}

/**
 * @param {string[]} lines
 * @param {(line: string, idx: number) => boolean} predicate
 * @param {number} [from]
 * @returns {number}
 */
function findIndex(lines, predicate, from = 0) {
  for (let i = from; i < lines.length; i++) {
    const val = lines[i] ?? '';
    if (predicate(val, i)) return i;
  }
  return -1;
}

/**
 * @param {string} line
 * @returns {string}
 */
function normalizeDandaEnd(line) {
  // Convert '||' to '॥', collapse any '॥ digits ॥' to single '॥'
  let s = line.replace(/\|\|/g, '॥');
  s = s.replace(/॥\s*\d+\s*॥/g, '॥');
  // Ensure only one terminal '॥' at end if present
  s = s.replace(/(॥)+\s*$/g, '॥');
  return s.trimEnd();
}

/**
 * @param {string} t
 * @returns {string}
 */
function stripPunctuationToken(t) {
  return t.replace(/[।॥]/g, '').trim();
}

/**
 * @param {string} devanagari
 * @returns {string[]}
 */
function tokenizeName(devanagari) {
  if (!devanagari) return [];
  // Split by spaces and remove punctuation
  return devanagari.split(/\s+/).map((p) => stripPunctuationToken(String(p))).filter(Boolean);
}

/**
 * @param {string[]} rootLines
 * @returns {Array<{ compound: string, sandhi: string | null, components: string[], grammar: string | null, literal: string, contextual: string }>} 
 */
function parseRootAnalysis(rootLines) {
  const table = parseMarkdownTable(rootLines);
  if (!table.rows.length) return [];
  return table.rows.map((row) => {
    const compound = row['Compound'] || row['compound'] || '';
    const sandhiRaw = row['Sandhi'] || row['sandhi'] || '';
    const componentsRaw = row['Components'] || row['components'] || '';
    const grammarRaw = row['Grammar'] || row['grammar'] || '';
    const literalRaw = row['Literal'] || row['Literal Meaning'] || row['literal'] || row['literal meaning'] || '';
    const contextualRaw = row['Contextual'] || row['Contextual Meaning'] || row['contextual'] || row['contextual meaning'] || '';

    const sandhi = sandhiRaw && sandhiRaw.trim() !== '—' && sandhiRaw.trim() !== '-' ? sandhiRaw.trim() : null;
    const components = componentsRaw
      .split('+')
      .map((s) => s.replace(/[“”"']/g, '').trim())
      .filter(Boolean);
    const grammar = grammarRaw && grammarRaw.trim() ? grammarRaw.trim() : null;

    return {
      compound: compound.trim(),
      sandhi,
      components,
      grammar,
      literal: literalRaw.trim(),
      contextual: contextualRaw.trim(),
    };
  });
}

/**
 * @param {string[]} compLines
 * @returns {{ overview: string, entries: Array<{ word: string, meaning: string }> }}
 */
function parseCompositions(compLines) {
  if (!compLines.length) return { overview: '', entries: [] };

  // Find where "Word-by-word meaning" section starts
  let wordByWordIndex = -1;
  for (let i = 0; i < compLines.length; i++) {
    if (/^\*\*Word-by-word meaning\*\*/i.test(compLines[i]?.trim() || '')) {
      wordByWordIndex = i;
      break;
    }
  }

  // Everything before "Word-by-word meaning" is the summary
  const summaryLines = wordByWordIndex >= 0 
    ? compLines.slice(0, wordByWordIndex)
    : compLines;

  // Everything after "Word-by-word meaning" are the bullet entries
  const bulletLines = wordByWordIndex >= 0
    ? compLines.slice(wordByWordIndex + 1)
    : [];

  // Extract prose (non-bullet lines) for summary
  const prose = [];
  for (const line of summaryLines) {
    const trimmed = line.trim();
    // Skip empty lines and markdown headers/bullets
    if (trimmed && !/^[\*\#\-\>\|]/.test(trimmed) && !trimmed.startsWith('**Word-by-word')) {
      prose.push(trimmed);
    }
  }

  const overview = prose.join(' ').replace(/\s{2,}/g, ' ').trim();

  // Extract bullet entries
  const entries = bulletLines
    .filter(line => /^\*\s+/.test(line.trim()))
    .map((b) => {
      const trimmed = b.trim();
      // * **श्रीमाता** — meaning (handles em dash —, en dash –, and hyphen -)
      const m = /^\*\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/.exec(trimmed);
      if (m) {
        const [, w = '', mm = ''] = m;
        return { word: w.trim(), meaning: mm.trim() };
      }
      // Fallback: try without bold
      const m2 = /^\*\s+([^—–-]+)[—–-]\s*(.+)$/.exec(trimmed);
      if (m2) {
        const [, w2 = '', mm2 = ''] = m2;
        return { word: w2.trim(), meaning: mm2.trim() };
      }
      return { word: trimmed.replace(/^\*\s+\*\*|\*\*$/, '').trim(), meaning: '' };
    });

  return { overview, entries };
}

/**
 * @param {string[]} lines
 * @returns {string}
 */
function stripBlockquote(lines) {
  return lines.map((l) => l.replace(/^>\s?/, '')).join('\n');
}

/**
 * @param {string[]} lines
 * @param {string} author
 * @param {string} period
 * @param {string} source
 * @returns {{ author: string, period: string, text: string, source: string }}
 */
function parseCommentary(lines, author, period, source) {
  const text = stripBlockquote(trimEmptyEdges(lines));
  return { author, period, text, source };
}

/**
 * Get metadata (author, period) for a commentary source
 * @param {string} source
 * @returns {{ author: string, period: string }}
 */
function getSourceMetadata(source) {
  const sourceLower = source.toLowerCase().replace(/\s+/g, '');
  
  // Known sources mapping
  /** @type {Record<string, { author: string, period: string }>} */
  const sourceMap = {
    'sanskritdocuments': { author: 'Sanskrit Documents', period: 'Modern' },
    'bhaskaraya': { author: 'Bhāskararāya', period: '18th century' },
    'vravi': { author: 'V. Ravi', period: 'Modern' },
  };
  
  const metadata = sourceMap[sourceLower];
  if (metadata) {
    return { author: metadata.author, period: metadata.period };
  }
  
  // Default: use source name as author, unknown period
  return { author: source, period: 'Unknown' };
}

/**
 * Parse COMMENTARIES section (e.g., ## COMMENTARIES (SANSKRITDOCUMENTS))
 * @param {string[]} lines
 * @returns {{ author: string, period: string, text: string, source: string } | null}
 */
function parseCommentariesSection(lines) {
  if (lines.length === 0) return null;
  
  // First line should be the section header: ## COMMENTARIES (SOURCE)
  const headerMatch = /^##\s+COMMENTARIES\s*\(([^)]+)\)/i.exec(lines[0]?.trim() || '');
  if (!headerMatch) return null;
  
  const sourceName = headerMatch[1]?.trim() || '';
  const commentLines = lines.slice(1);
  
  // Extract commentary from blockquote lines (format: > **name** — commentary)
  const commentaryText = commentLines
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('>')) {
        // Remove > and extract text after the Sanskrit name and em dash
        const cleanLine = trimmed.replace(/^>\s*\*\*[^*]+\*\*\s*—\s*/, '').replace(/^>\s*/, '').trim();
        return cleanLine;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
  
  const { author, period } = getSourceMetadata(sourceName);
  
  // Source can be a link - check if sourceName looks like a URL
  const source = sourceName.startsWith('http://') || sourceName.startsWith('https://') 
    ? sourceName 
    : sourceName;
  
  return { 
    author, 
    period, 
    text: commentaryText.trim(),
    source 
  };
}

/**
 * @param {string[]} nameLinesRaw
 * @returns {{ devanagari: string, iast: string, nameNumber: number | null }}
 */
function parseNameLines(nameLinesRaw) {
  let devanagari = '';
  let iast = '';
  let nameNumber = null;

  for (let i = 0; i < nameLinesRaw.length; i++) {
    const line = nameLinesRaw[i]?.replace(/^>\s*/, '').trim() || '';
    
    // Check for name number (॥ N ॥)
    const nameNumMatch = /॥\s*(\d+)\s*॥/.exec(line);
    if (nameNumMatch) {
      nameNumber = Number(nameNumMatch[1]);
      continue;
    }

    // Check if line is IAST (starts with Latin characters)
    const isIAST = /^[a-zA-Zāīūṛēōṃḥśṣṇṭḍ]/i.test(line);
    
    if (isIAST && !iast) {
      // First IAST line is the name in IAST
      iast = line.replace(/[।॥]/g, '').trim();
    } else if (!isIAST && line && !/^[॥|]/i.test(line) && !devanagari) {
      // First non-IAST line (that's not verse number) is the name in Devanagari
      devanagari = line.replace(/[।॥]/g, '').trim();
    }
  }

  return { devanagari, iast, nameNumber };
}

/**
 * @param {string[]} etymologyLines
 * @returns {Record<string, any>}
 */
function parseEtymology(etymologyLines) {
  /** @type {Record<string, any>} */
  const etymology = {};
  let currentCompound = null;
  /** @type {any} */
  let currentData = null;

  for (let i = 0; i < etymologyLines.length; i++) {
    const line = etymologyLines[i]?.trim() || '';
    
    // Check for compound header (### N. **compound** or ### **compound**)
    const compoundMatch = /^###\s*\d+\.\s*\*\*(.+?)\*\*|^###\s*\*\*(.+?)\*\*/i.exec(line);
    if (compoundMatch) {
      // Save previous compound
      if (currentCompound && currentData) {
        etymology[currentCompound] = currentData;
      }
      currentCompound = (compoundMatch[1] || compoundMatch[2] || '').trim();
      currentData = {
        breakdown: /** @type {string[]} */ ([]),
        dhatu: { root: '', meaning: '', class: '' },
        upasarga: /** @type {string[]} */ ([]),
        suffix: '',
        sandhi: null,
        formation: '',
        grammar: '',
        meaning: { literal: '', contextual: '' }
      };
      continue;
    }

    if (!currentCompound || !currentData) continue;

    // Parse breakdown
    const breakdownMatch = /^\*\*Breakdown\*\*:\s*`(.+?)`/.exec(line);
    if (breakdownMatch && currentData) {
      currentData.breakdown = breakdownMatch[1]?.split('+').map(s => s.trim()).filter(Boolean) || [];
      continue;
    }

    // Parse roots/dhatu
    const dhatuMatch = /-?\s*\*\*Root.*?\*\*:?\s*(?:.*?)?√([a-zāīūṛēō]+)\s*\([^)]+\)\s*—\s*"([^"]+)"\s*(?:\(Class\s*(\d+[PA])\))?/i.exec(line);
    if (dhatuMatch && currentData) {
      currentData.dhatu.root = dhatuMatch[1] || '';
      currentData.dhatu.meaning = dhatuMatch[2] || '';
      currentData.dhatu.class = dhatuMatch[3] || '';
      continue;
    }

    // Parse upasarga
    const upasargaMatch = /-?\s*\*\*Upasarga.*?\*\*:?\s*(.+?)(?:\n|$)/i.exec(line);
    if (upasargaMatch && currentData) {
      const upasargaText = upasargaMatch[1]?.trim() || '';
      currentData.upasarga = upasargaText.split(',').map(s => s.trim()).filter(Boolean);
      continue;
    }

    // Parse suffix
    const suffixMatch = /-?\s*\*\*Suffix\*\*:?\s*(.+?)(?:\n|$)/i.exec(line);
    if (suffixMatch && currentData) {
      currentData.suffix = suffixMatch[1]?.trim() || '';
      continue;
    }

    // Parse sandhi
    const sandhiMatch = /-?\s*\*\*Sandhi\*\*:?\s*(.+?)(?:\n|$)/i.exec(line);
    if (sandhiMatch && currentData) {
      const sandhiText = sandhiMatch[1]?.trim() || '';
      currentData.sandhi = sandhiText === 'none' || sandhiText === '—' ? null : sandhiText;
      continue;
    }

    // Parse formation
    const formationMatch = /-?\s*\*\*Formation\*\*:?\s*(.+)/i.exec(line);
    if ((formationMatch || line.includes('Formation')) && currentData) {
      // Formation can be multi-line, collect until next field
      let formationLines = [];
      for (let j = i; j < etymologyLines.length; j++) {
        const formLine = etymologyLines[j]?.trim() || '';
        if (formLine && !formLine.startsWith('- **') && !formLine.startsWith('###')) {
          formationLines.push(formLine.replace(/^[\d.\s]+/, '').trim());
        } else if (formationLines.length > 0) {
          break;
        }
      }
      currentData.formation = formationLines.join(' → ');
      continue;
    }

    // Parse grammar
    const grammarMatch = /-?\s*\*\*Grammar\*\*:?\s*(.+?)(?:\n|$)/i.exec(line);
    if (grammarMatch && currentData) {
      currentData.grammar = grammarMatch[1]?.trim() || '';
      continue;
    }

    // Parse meaning
    const literalMatch = /-?\s*\*\*Literal\*\*:?\s*"([^"]+)"/.exec(line);
    if (literalMatch && currentData) {
      currentData.meaning.literal = literalMatch[1]?.trim() || '';
      continue;
    }

    const contextualMatch = /-?\s*\*\*Contextual\*\*:?\s*"([^"]+)"/.exec(line);
    if (contextualMatch && currentData) {
      currentData.meaning.contextual = contextualMatch[1]?.trim() || '';
      continue;
    }

    // Handle meaning with arrow (→)
    const meaningArrowMatch = /-?\s*\*\*Meaning\*\*:?\s*"([^"]+)"\s*→\s*\*\*([^*]+)\*\*/.exec(line);
    if (meaningArrowMatch && currentData) {
      currentData.meaning.literal = meaningArrowMatch[1]?.trim() || '';
      currentData.meaning.contextual = meaningArrowMatch[2]?.trim() || '';
      continue;
    }
  }

  // Save last compound
  if (currentCompound && currentData) {
    etymology[currentCompound] = currentData;
  }

  return etymology;
}

/**
 * Parse sanskrit.txt to map names to verses
 * @param {string} sanskritText
 * @returns {Map<number, number>} Map from name number to verse number
 */
function parseSanskritMapping(sanskritText) {
  /** @type {Map<number, number>} */
  const nameToVerse = new Map();
  const lines = sanskritText.split('\n');
  
  let currentVerse = 0;
  /** @type {string[]} */
  const currentTokens = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for verse end (॥ N ॥)
    const verseEndMatch = /॥\s*(\d+)\s*॥/.exec(trimmed);
    if (verseEndMatch) {
      currentVerse = Number(verseEndMatch[1]);
      // Tokenize the verse to count names
      const verseTokens = trimmed
        .replace(/॥\s*\d+\s*॥/g, '')
        .split(/[।\s]+/)
        .map(t => t.trim())
        .filter(t => t && !/^[॥।]$/.test(t));
      
      currentTokens.push(...verseTokens);
      continue;
    }
    
    // If we've seen a verse number, accumulate tokens
    if (currentVerse > 0) {
      const tokens = trimmed
        .split(/[।\s]+/)
        .map(t => t.trim())
        .filter(t => t && !/^[॥।]$/.test(t));
      currentTokens.push(...tokens);
    }
    
    // Check if this is a new verse (no verse number yet, but previous verse ended)
    if (!verseEndMatch && currentVerse > 0 && trimmed && !trimmed.includes('॥')) {
      const tokens = trimmed
        .split(/[।\s]+/)
        .map(t => t.trim())
        .filter(t => t && !/^[॥।]$/.test(t));
      currentTokens.push(...tokens);
    }
  }
  
  // Map names to verses (simplified: assume names appear in order within verses)
  let nameNum = 1;
  for (const token of currentTokens) {
    if (token && token.length > 0) {
      // Find which verse this token belongs to by checking verse boundaries
      // For now, we'll need a better approach - let's use a simpler method
      break;
    }
  }
  
  return nameToVerse;
}

/**
 * @param {string[]} blockLines
 */
function parseNameBlock(blockLines) {
  // Expect first line like: # NAME N
  const titleLine = blockLines[0] ?? '';
  const m = /^#\s+NAME\s+(\d+)/i.exec(titleLine.trim());
  let nameNumber = m ? Number(m[1]) : null;

  const idxRoot = findIndex(blockLines, (l) => 
    /^##\s+ROOT\s+BREAKDOWN/i.test(l.trim())
  );
  const idxEtymology = findIndex(blockLines, (l) => 
    /^##\s+ETYMOLOGY\s*\(/i.test(l.trim())
  );
  const idxComp = findIndex(blockLines, (l) => 
    /^##\s+COMPOSITIONS/i.test(l.trim())
  );
  const idxBh = findIndex(blockLines, (l) => 
    /^##\s+COMMENTARY\s*\(.*BH.*SKARAR.*YA/i.test(l.trim())
  );
  const idxVR = findIndex(blockLines, (l) => 
    /^##\s+COMMENTARY\s*\(.*V\.?\s*RAVI/i.test(l.trim())
  );
  
  // Find all COMMENTARIES sections (dynamic, can have different sources)
  const commentariesSections = [];
  let currentCommentaryIdx = findIndex(blockLines, (l) => 
    /^##\s+COMMENTARIES\s*\(/i.test(l.trim())
  );
  while (currentCommentaryIdx !== -1) {
    // Find the end of this COMMENTARIES section (next ## section or end of block)
    let endIdx = currentCommentaryIdx + 1;
    while (endIdx < blockLines.length) {
      if (blockLines[endIdx]?.trim().startsWith('##')) {
        break;
      }
      endIdx++;
    }
    
    const commentaryLines = blockLines.slice(currentCommentaryIdx, endIdx);
    const parsed = parseCommentariesSection(commentaryLines);
    if (parsed) {
      commentariesSections.push(parsed);
    }
    
    // Find next COMMENTARIES section
    currentCommentaryIdx = findIndex(blockLines, (l) => 
      /^##\s+COMMENTARIES\s*\(/i.test(l.trim())
    , endIdx);
  }

  // Parse name lines (between title and ROOT BREAKDOWN or first section)
  const nameStart = 1;
  const nameEnd = idxRoot !== -1 ? idxRoot : 
                   idxEtymology !== -1 ? idxEtymology : 
                   idxComp !== -1 ? idxComp : blockLines.length;
  const nameLinesRaw = trimEmptyEdges(blockLines.slice(nameStart, nameEnd));
  
  // Extract Devanagari, IAST, and name number
  const { devanagari, iast, nameNumber: nameNumFromText } = parseNameLines(nameLinesRaw);
  if (nameNumFromText !== null) {
    nameNumber = nameNumFromText;
  }

  const tokens = tokenizeName(devanagari);

  // Parse ROOT BREAKDOWN table
  const rootStart = idxRoot !== -1 ? idxRoot + 1 : -1;
  const rootEnd = idxEtymology !== -1 ? idxEtymology : 
                idxComp !== -1 ? idxComp : blockLines.length;
  const rootLines = idxRoot !== -1 ? trimEmptyEdges(sliceBetween(blockLines, rootStart, rootEnd)) : [];

  // Parse ETYMOLOGY section
  const etymologyStart = idxEtymology !== -1 ? idxEtymology + 1 : -1;
  const etymologyEnd = idxComp !== -1 ? idxComp : blockLines.length;
  const etymologyLines = idxEtymology !== -1 ? trimEmptyEdges(sliceBetween(blockLines, etymologyStart, etymologyEnd)) : [];

  // Parse COMPOSITIONS
  const compStart = idxComp !== -1 ? idxComp + 1 : -1;
  const compEnd = idxBh !== -1 ? idxBh : blockLines.length;
  const compLines = idxComp !== -1 ? trimEmptyEdges(sliceBetween(blockLines, compStart, compEnd)) : [];

  // Parse commentaries
  const bhStart = idxBh !== -1 ? idxBh + 1 : -1;
  const bhEnd = idxVR !== -1 ? idxVR : blockLines.length;
  const bhLines = idxBh !== -1 ? trimEmptyEdges(sliceBetween(blockLines, bhStart, bhEnd)) : [];

  const vrStart = idxVR !== -1 ? idxVR + 1 : -1;
  const vrEnd = blockLines.length;
  const vrLines = idxVR !== -1 ? trimEmptyEdges(sliceBetween(blockLines, vrStart, vrEnd)) : [];

  const rootAnalysis = parseRootAnalysis(rootLines);
  const parsedEtymology = parseEtymology(etymologyLines);
  /** @type {{ overview: string, entries: Array<{ word: string, meaning: string }> }} */
  const comp = parseCompositions(compLines);

  /** @type {Array<any>} */
  const wordByWord = (comp && comp.entries) ? comp.entries.map((e) => ({ compound: e.word, meaning: e.meaning })) : [];

  // Build rootBreakdown from ROOT table
  const rootBreakdown = rootAnalysis.map((r) => ({
    compound: r.compound,
    sandhi: r.sandhi,
    components: r.components,
    grammar: r.grammar,
    meaning: { 
      literal: r.literal, 
      contextual: r.contextual 
    }
  }));

  // Merge etymology from detailed section with root breakdown data
  /** @type {Record<string, any>} */
  const etymology = {};
  for (const rb of rootBreakdown) {
    const detailed = parsedEtymology[rb.compound] || {};
    etymology[rb.compound] = {
      breakdown: detailed.breakdown && detailed.breakdown.length > 0 ? detailed.breakdown : rb.components,
      dhatu: detailed.dhatu && detailed.dhatu.root ? detailed.dhatu : { root: '', meaning: '', class: '' },
      upasarga: detailed.upasarga && detailed.upasarga.length > 0 ? detailed.upasarga : [],
      suffix: detailed.suffix || '',
      sandhi: detailed.sandhi !== undefined ? detailed.sandhi : rb.sandhi,
      formation: detailed.formation || '',
      grammar: detailed.grammar || rb.grammar || '',
      meaning: {
        literal: detailed.meaning?.literal || rb.meaning.literal || '',
        contextual: detailed.meaning?.contextual || rb.meaning.contextual || ''
      }
    };
  }

  return {
    nameNumber,
    name: {
      devanagari,
      iast,
      tokens,
    },
    rootBreakdown,
    etymology,
    compositions: {
      summary: (comp && comp.overview) ? comp.overview : '',
      wordByWord,
    },
    commentaries: {
      bhaskararaya: parseCommentary(bhLines, 'Bhāskararāya', '18th century', 'Saubhāgya-bhāskara'),
      vRavi: parseCommentary(vrLines, 'V. Ravi', 'Modern', 'Contemporary Translation'),
      // Add dynamic commentaries from COMMENTARIES sections (same structure)
      ...Object.fromEntries(
        commentariesSections.map(c => {
          const key = c.source.toLowerCase().replace(/\s+/g, '');
          return [key, {
            author: c.author,
            period: c.period,
            text: c.text,
            source: c.source
          }];
        })
      ),
    },
  };
}

async function main() {
  const inputPath = path.resolve(projectRoot, INPUT_RELATIVE_PATH);
  const outputPath = path.resolve(projectRoot, OUTPUT_RELATIVE_PATH);
  const sanskritPath = path.resolve(projectRoot, SANSKRIT_RELATIVE_PATH);

  // Read meanings.md
  const raw = await fs.readFile(inputPath, 'utf8');
  /** @type {string[]} */
  const lines = raw.split('\n');

  // Read sanskrit.txt for verse mapping (optional for now)
  let sanskritText = '';
  try {
    sanskritText = await fs.readFile(sanskritPath, 'utf8');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn(`Could not read ${SANSKRIT_RELATIVE_PATH}, skipping: ${errorMessage}`);
  }

  // Split into blocks at lines starting with # NAME
  /** @type {string[][]} */
  const blocks = [];
  /** @type {string[]} */
  let current = [];
  for (const line of lines) {
    if (line.startsWith('# NAME ')) {
      if (current.length > 0) blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);

  const names = blocks.map(parseNameBlock);

  // Basic sanity: ensure ordered by nameNumber when available
  const ordered = names.sort((a, b) => (a.nameNumber ?? 0) - (b.nameNumber ?? 0));

  await fs.writeFile(outputPath, JSON.stringify(ordered, null, 2) + '\n', 'utf8');
  console.log(`Parsed ${ordered.length} names to ${path.relative(projectRoot, outputPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
