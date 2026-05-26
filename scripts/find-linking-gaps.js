// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sanskritText = fs.readFileSync(path.join(projectRoot, 'src/constants/sanskrit.txt'), 'utf-8');
const vravi = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/commentaries-json/vravi.json'), 'utf-8'));
const sdocs = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/commentaries-json/sanskritdocuments.json'), 'utf-8'));
const root = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/commentaries-json/root.json'), 'utf-8'));

const concludingLinePattern = /एवं\s+श्रीललिता\s+देव्या\s+नाम्नां\s+साहस्रकं\s+जगुः/;

function normalizeName(name) {
  return name
    .replace(/-/g, '')
    .replace(/\s+/g, '')
    .replace(/ऽ/g, '')
    .replace(/ा/g, '')
    .replace(/ू/g, 'ु')
    .replace(/ी/g, 'ि')
    .replace(/ै/g, 'े')
    .replace(/ौ/g, 'ो')
    .replace(/आ/g, 'अ')
    .replace(/ऊ/g, 'उ')
    .replace(/ई/g, 'इ')
    .replace(/ऐ/g, 'ए')
    .replace(/औ/g, 'ओ')
    .replace(/ङ्क/g, 'ंक')
    .replace(/ङ्ख/g, 'ंख')
    .replace(/ङ्ग/g, 'ंग')
    .replace(/ङ्घ/g, 'ंघ')
    .replace(/ञ्च/g, 'ंच')
    .replace(/ञ्ज/g, 'ंज')
    .replace(/ण्ट/g, 'ंट')
    .replace(/ण्ठ/g, 'ंठ')
    .replace(/ण्ड/g, 'ंड')
    .replace(/ण्ढ/g, 'ंढ')
    .replace(/न्त/g, 'ंत')
    .replace(/न्द/g, 'ंद')
    .replace(/न्ध/g, 'ंध')
    .replace(/म्प/g, 'ंप')
    .replace(/म्फ/g, 'ंफ')
    .replace(/म्ब/g, 'ंब')
    .replace(/म्भ/g, 'ंभ');
}

function buildIndex(src) {
  const idx = new Map();
  for (const k of Object.keys(src)) idx.set(normalizeName(k), k);
  return idx;
}

function trySandhiSplit(name, src, idx) {
  const vowels = 'अआइईउऊऋॠएऐओऔ';
  const consonants = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळक्षज्ञ';
  const matraMap = { 'ा':'आ','ि':'इ','ी':'ई','ु':'उ','ू':'ऊ','ृ':'ऋ','ॄ':'ॠ','े':'ए','ै':'ऐ','ो':'ओ','ौ':'औ' };
  function resolve(cand) {
    if (src[cand]) return [cand];
    const f = idx.get(normalizeName(cand));
    if (f) return [f];
    const s = trySandhiSplit(cand, src, idx);
    if (s) return s;
    return null;
  }
  const tryPair = (left, rest) => {
    const lk = src[left] ? left : idx.get(normalizeName(left));
    if (!lk) return null;
    const r = resolve(rest);
    if (!r) return null;
    return [lk, ...r];
  };
  for (let i = 1; i < name.length - 1; i++) {
    if (name[i] === '्' && name[i-1] === 'र') {
      const r = tryPair(name.slice(0, i-1) + 'ः', name.slice(i+1));
      if (r) return r;
    }
    if (name[i] === 'र' && vowels.includes(name[i+1] || '')) {
      const r = tryPair(name.slice(0, i) + 'ः', name.slice(i+1));
      if (r) return r;
    }
    if (name[i] === 'र' && name[i+1] !== '्' && consonants.includes(name[i+1] || '') && name[i-1] !== '्') {
      const r = tryPair(name.slice(0, i) + 'ः', 'अ' + name.slice(i+1));
      if (r) return r;
    }
    const matra = name[i+1];
    if (name[i] === 'र' && matra && matraMap[matra] && name[i-1] !== '्') {
      const r = tryPair(name.slice(0, i) + 'ः', matraMap[matra] + name.slice(i+2));
      if (r) return r;
    }
    if ((name[i] === 'स' || name[i] === 'श' || name[i] === 'ष') && name[i+1] === '्' && consonants.includes(name[i+2] || '') && i > 0 && name[i-1] !== '्') {
      const r = tryPair(name.slice(0, i) + 'ः', name.slice(i+2));
      if (r) return r;
    }
  }
  return null;
}

function findCommentary(name, src, idx) {
  if (name === 'ॐ' || name === 'ओं') return 'om';
  if (src[name]) return src[name];

  const dashless = name.replace(/-/g, '');
  if (dashless !== name && src[dashless]) return src[dashless];
  name = dashless;

  if (name.includes('ऽ')) {
    const nameWithA = name.replace(/ऽ+/g, 'अ');
    if (src[nameWithA]) return src[nameWithA];
    const splitParts = [];
    let cursor = 0, pendingElided = '';
    while (cursor < name.length) {
      const nextA = name.indexOf('ऽ', cursor);
      if (nextA === -1) {
        const tail = name.slice(cursor);
        if (tail) splitParts.push({ text: tail, elided: pendingElided });
        break;
      }
      const chunk = name.slice(cursor, nextA);
      if (chunk || pendingElided) splitParts.push({ text: chunk, elided: pendingElided });
      let count = 0; cursor = nextA;
      while (name[cursor] === 'ऽ') { count++; cursor++; }
      pendingElided = count >= 2 ? 'आ' : 'अ';
    }
    if (splitParts.length >= 2) {
      const entries = [];
      let ok = true;
      for (const { text, elided } of splitParts) {
        const candidates = elided ? [elided + text, text] : [text];
        let matched = null;
        for (const c of candidates) {
          if (src[c]) { matched = [c]; break; }
          const f = idx.get(normalizeName(c));
          if (f) { matched = [f]; break; }
          const sandhi = trySandhiSplit(c, src, idx);
          if (sandhi) { matched = sandhi; break; }
        }
        if (!matched) { ok = false; break; }
        entries.push(...matched);
      }
      if (ok && entries.length > 0) return entries.join('+');
    }
  }

  for (const key in src) { if (key.replace(/-/g, '') === name) return src[key]; }

  const norm = normalizeName(name);
  const fuzzy = idx.get(norm);
  if (fuzzy) return src[fuzzy];

  const sandhi = trySandhiSplit(name, src, idx);
  if (sandhi) return sandhi.join('+');
  return null;
}

function parseWordsFromLine(line) {
  const result = [];
  const breakdownPattern = /(\S+)\s+\[([^\]]+)\](?:\s*\(\d+\))?/g;
  const breakdowns = new Map();
  let processedLine = line;
  for (const match of line.matchAll(breakdownPattern)) {
    const word = (match[1] || '').replace(/[।॥]*$/, '');
    if (!word) continue;
    breakdowns.set(word, (match[2] || '').split(/\s*\+\s*/).map(c => c.trim()).filter(Boolean));
    processedLine = processedLine.replace(match[0], match[1]);
  }
  const parts = processedLine.split(/(॥\s*[०-९\d]+\s*॥)/);
  for (const part of parts) {
    if (!part || !part.trim()) continue;
    if (/॥\s*[०-९\d]+\s*॥/.test(part)) continue;
    const words = part.split(/\s+/).filter(w => w && w.trim());
    let parenDepth = 0;
    for (const word of words) {
      const opens = (word.match(/\(/g) || []).length;
      const closes = (word.match(/\)/g) || []).length;
      const wasInside = parenDepth > 0;
      parenDepth = Math.max(0, parenDepth + opens - closes);
      if (wasInside || opens > 0 || word.includes(')')) continue;
      const m = word.match(/^(.+?)([।]*)$/);
      if (m && m[1]) {
        result.push({ word: m[1], components: breakdowns.get(m[1]) });
      }
    }
  }
  return result;
}

const vIdx = buildIndex(vravi);
const sIdx = buildIndex(sdocs);
const rIdx = buildIndex(root);

const lines = sanskritText.split('\n');
const missing = { vravi: [], sdocs: [], root: [], all: [] };

lines.forEach((line, lineIdx) => {
  if (!line.trim() || concludingLinePattern.test(line)) return;
  const parsed = parseWordsFromLine(line);
  for (const item of parsed) {
    if (item.word === 'ॐ' || item.word === 'ओं') continue;
    if (!/[ऀ-ॿ]/.test(item.word)) continue;
    const targets = item.components && item.components.length > 0 ? item.components : [item.word];
    for (const t of targets) {
      const hasV = findCommentary(t, vravi, vIdx);
      const hasS = findCommentary(t, sdocs, sIdx);
      const hasR = findCommentary(t, root, rIdx);
      const tag = targets === item.components ? `${t} (component of ${item.word})` : t;
      if (!hasV) missing.vravi.push(`L${lineIdx+1}: ${tag}`);
      if (!hasS) missing.sdocs.push(`L${lineIdx+1}: ${tag}`);
      if (!hasR) missing.root.push(`L${lineIdx+1}: ${tag}`);
      if (!hasV && !hasS && !hasR) missing.all.push(`L${lineIdx+1}: ${tag}`);
    }
  }
});

console.log('Missing from vravi:', missing.vravi.length);
console.log('Missing from sdocs:', missing.sdocs.length);
console.log('Missing from root:', missing.root.length);
console.log('Missing from ALL (will not expand):', missing.all.length);
console.log('\nALL-missing list:');
console.log(missing.all.join('\n'));
