# Prompt for Converting Names to Markdown (Lalita Sahasranama)

## TASK

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

[Full name in Devanagari]  
॥ <n> ॥

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

**EXAMPLE:**

```
## TASK

**Please analyze the Sanskrit name below from the Lalita Sahasranama and provide a complete ROOT BREAKDOWN analysis.**

Break down the name into its constituent parts, identify the root (dhātu) for each component, and provide essential meanings. Focus on meanings rather than detailed grammatical analysis. Follow all the rules and requirements listed below.

---

## Name to analyze:

श्रीमाता  
॥ 1 ॥

---

Expected output (each breakdown on a single row):

श्रीमाता -> prosperity + mother + auspicious mother

महाराज्ञी -> great + queen + great queen

श्री -> radiance + prosperity + divine beauty + auspiciousness

महा -> great + exalted + vast

राज्ञी -> queen + empress + sovereign ruler

माता -> mother + nourisher + protector of life

---
```