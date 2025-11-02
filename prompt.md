# Prompt for Converting Names to Markdown (Lalita Sahasranama)

## TASK

**Please analyze the Sanskrit name below from the Lalita Sahasranama and provide a complete ROOT BREAKDOWN analysis.**

Break down the name into its constituent parts, identify all grammatical elements (sandhi, components, roots), and provide both literal and contextual meanings. Follow all the rules and requirements listed below.

## CONTEXT

This name is from the **Lalita Sahasranama** (ललिता सहस्रनाम), a sacred Hindu text containing 1000 names of the Goddess Lalita Tripurasundari. The analysis should consider the spiritual and devotional context of this text.

## OUTPUT FORMAT

**You must return your response as plain text in the following format:**

- Simple plain text lines
- Each breakdown on its own line/row
- No headers or markdown structure
- Just the breakdown text itself

**Format each word breakdown as:**
[word] -
[breakdown explanation]

**Return only the root breakdown text content (no headers, no markdown structure, just plain text breakdowns).**

---

## Name to analyze:

[Full name in Devanagari]  
[IAST transliteration]  
॥ <n> ॥

---

**MANDATORY REQUIREMENTS**:

1. **No compound left unbroken** — go to **dhātu level**  
2. **Include sandhi** even if minimal  
3. **Use IAST** for all transliteration  
4. **Full breakdown must be provided in plain text format**  
5. **Each breakdown should be on its own line/row**
6. **All roots must be verifiable in standard Sanskrit grammar (Pāṇini, Siddhānta-kaumudī, etc.)**
7. **Break down every compound word** into its constituent parts
8. **Provide clear separation between different components**
9. **Return ONLY the breakdown text - no headers, no markdown sections, just plain text**

---

**EXAMPLE:**

```
## TASK

**Please analyze the Sanskrit name below from the Lalita Sahasranama and provide a complete ROOT BREAKDOWN analysis.**

Break down the name into its constituent parts, identify all grammatical elements (sandhi, components, roots), and provide both literal and contextual meanings. Follow all the rules and requirements listed below.

---

## Name to analyze:

श्रीमाता  
śrīmātā  
॥ 1 ॥

---

Expected output:

श्री -
prefix denoting auspiciousness, prosperity

माता -
mother (from मातृ dhātu), feminine nominative singular

---
```