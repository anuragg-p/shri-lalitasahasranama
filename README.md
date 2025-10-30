# Our goal for this app

1. All the verses should be separated by spaces
2. When we click on a specific verse there should be a popup explaining it (we can do that later on) just like we have for obsidian.
3. We need to build a parser for the verses this will be the format (Should be .md)


## ROOT BREAKDOWN

# NAME 1

> ॐ श्रीमाता नमः  
> oṃ śrīmātā namaḥ  
> ॥ 1 ॥

---

## ROOT BREAKDOWN

| Compound | Sandhi | Components | Grammar | Literal | Contextual |
|----------|--------|------------|---------|---------|------------|
| श्रीमाता | — | श्री + माता | f-nom-sg | prosperity + mother | Divine Mother of Prosperity |

---

## ETYMOLOGY (DETAILED)

### श्रीमाता
- **Breakdown**: श्री + माता  
- **Root (Dhātu)**: √mā (मा) — "to give birth, measure" (Class 1P) → mātṛ  
- **Upasarga(s)**: none  
- **Suffix**: tṛ → mātā (feminine)  
- **Sandhi**: —  
- **Formation**: śrī (noun) + mātā → tatpuruṣa  
- **Grammar**: feminine, nominative, singular  
- **Meaning**:  
  - **Literal**: "Mother of Prosperity"  
  - **Contextual**: "The Divine Mother who is Śrī incarnate"

---

## COMPOSITIONS

This name invokes Lalitā as the **supreme sovereign mother** who embodies **auspiciousness**.

**Word-by-word meaning**:
- **श्रीमाता** — the auspicious Divine Mother  

---

## COMMENTARY (BHĀSKARARĀYA)

> श्रीमाता — सा एव श्रीः माता च। सर्वं विश्वं तस्याः पुत्रः।  
> — *Saubhāgya-bhāskara*

---

## COMMENTARY (V. RAVI)

> "Śrīmātā" encapsulates the nurturing essence of the Goddess as the source of all prosperity and creation.  
> — V. Ravi

---

# PARSED JSON

```json
{
  "nameNumber": 1,
  "name": {
    "devanagari": "श्रीमाता",
    "iast": "śrīmātā",
    "tokens": [
       "श्रीमाता"
    ]
  },
  "rootBreakdown": [
    {
      "compound": "श्रीमाता",
      "sandhi": null,
      "components": ["श्री", "माता"],
      "grammar": "f-nom-sg",
      "meaning": {
        "literal": "prosperity + mother",
        "contextual": "Divine Mother of Prosperity"
      }
    }
  ],
  "etymology": {
    "श्रीमाता": {
      "breakdown": ["श्री", "माता"],
      "dhatu": { "root": "मा", "meaning": "to give birth", "class": "1P" },
      "upasarga": [],
      "suffix": "तृ → माता",
      "sandhi": null,
      "formation": "śrī + mātā → tatpuruṣa",
      "grammar": "feminine, nominative, singular",
      "meaning": {
        "literal": "Mother of Prosperity",
        "contextual": "The Divine Mother who is Śrī incarnate"
      }
    }
  },
  "compositions": {
    "summary": "This name invokes Lalitā as the supreme sovereign mother who embodies auspiciousness.", "wordByWord": [
      { "compound": "श्रीमाता", "meaning": "the auspicious Divine Mother" }
    ]
  },
  "commentaries": {
    "bhaskararaya": {
      "author": "Bhāskararāya",
      "period": "18th century",
      "source": "Saubhāgya-bhāskara",
      "text": "श्रीमाता — सा एव श्रीः माता च। सर्वं विश्वं तस्याः पुत्रः।"
    },
    "vRavi": {
      "author": "V. Ravi",
      "period": "Modern",
      "source": "Contemporary Translation",
      "text": "\"Śrīmātā\" encapsulates the nurturing essence of the Goddess as the source of all prosperity and creation."
    }
  }
}
```json