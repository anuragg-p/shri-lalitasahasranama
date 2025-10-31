# Prompt for Converting Names to Markdown (Lalita Sahasranama)

## TASK

**Please analyze the Sanskrit name below and provide a complete ROOT BREAKDOWN analysis.**

Break down the name into its constituent parts, identify all grammatical elements (sandhi, components, roots), and provide both literal and contextual meanings. Follow all the rules and requirements listed below.

## OUTPUT FORMAT

**You must return your response in Markdown format (.md) with the following structure:**

1. Start with the name header: `# NAME <number>`
2. Include the name in Devanagari and IAST (if available)
3. Fill in the ROOT BREAKDOWN table with complete analysis
4. Replace all placeholder text (e.g., `[root1] + [root2]`, `[morphology]`) with actual values
5. Ensure the table is valid Markdown
6. Provide complete information for each column: Compound, Sandhi, Components, Grammar, Literal, Contextual

**Return only the completed markdown content, starting from `# NAME <number>` through the filled ROOT BREAKDOWN table.**

---

# NAME <n>

> [Full name in Devanagari]  
> [IAST transliteration]  
> ॥ <n> ॥

---

## ROOT BREAKDOWN

| Compound | Sandhi | Components | Grammar | Literal | Contextual |
|----------|--------|------------|---------|---------|------------|
| [word] | [e.g. visarga → t] | [root1] + [root2] + … | [morphology] | [word-for-word] | [in name] |

> **Rules**:  
> - `Components` = upasarga + dhātu + kṛt/taddhita + pratyaya  
> - `Grammar` = √class-gender-case-number-form (e.g. `√1P-f-nom-sg-PPP`)  
> - `Sandhi` = specific rule applied (or `—` if none)

---

**MANDATORY REQUIREMENTS**:

1. **No compound left unbroken** — go to **dhātu level**  
2. **Include sandhi** even if minimal  
3. **Use IAST** for all transliteration  
4. **All tables must be valid Markdown**  
5. **All roots must be verifiable in standard Sanskrit grammar (Pāṇini, Siddhānta-kaumudī, etc.)**
6. **Break down every compound word** into its constituent parts

---

**EXAMPLE: NAME 1 (CORRECT & COMPLETE)**

```markdown
## TASK

**Please analyze the Sanskrit name below and provide a complete ROOT BREAKDOWN analysis.**

Break down the name into its constituent parts, identify all grammatical elements (sandhi, components, roots), and provide both literal and contextual meanings. Follow all the rules and requirements listed below.

---

# NAME 1

> श्रीमाता  
> śrīmātā  
> ॥ 1 ॥

---

## ROOT BREAKDOWN

| Compound | Sandhi | Components | Grammar | Literal | Contextual |
|----------|--------|------------|---------|---------|------------|
| श्रीमाता | — | श्री + माता | f-nom-sg | prosperity + mother | Divine Mother of Prosperity |

---
```