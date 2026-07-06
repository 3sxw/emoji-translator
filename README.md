# 😀 Emoji Translator

<img width="800" height="463" alt="ezgif com-video-to-gif-converter-2" src="https://github.com/user-attachments/assets/6669f89a-e462-4904-a8c4-930181b97e01" />

A single-page app that translates text into emojis — type a sentence, hit
**Translate**, and every recognizable word is swapped for its emoji.
Numbers, punctuation, and words with no match pass through unchanged.

No build step, no dependencies, no backend — just HTML, CSS, and vanilla
JavaScript.

## Quick start

Clone the repo and open `index.html` directly in a browser:

```bash
git clone https://github.com/3sxw/emoji-translator.git
cd emoji-translator
open index.html          # macOS
# or just double-click index.html
```

Or serve it locally:

```bash
npx http-server -p 8642
```

## Features

- Enter any text — words, numbers, punctuation — and click **Translate**
- Clear warnings if you translate empty or unchanged text
- **Clear** button resets both the input and output boxes
- **📋 Copy result** button, with clipboard fallback for older browsers
- **⚡ Live mode** — translate as you type, no button needed
- **🎲 Surprise me** — fills in a random example sentence
- **Translation stats** — "✨ 5 of 8 words became emojis (63%)"
- A fun, animated UI: gradient background, floating emojis, an emoji burst
  on every translation — all respecting `prefers-reduced-motion`

## Multi-language input

Pick the input language from the dropdown: **English, Spanish, French,
German, or Arabic**. Each has its own dictionary, and Arabic text boxes
switch to right-to-left automatically. Loan words like "pizza" or "robot"
translate correctly no matter which language is selected.

## Forgiving matching

The translator is built to catch real-world typing, not just dictionary-
perfect input:

- **Accent/diacritic insensitive** — café/cafe, glücklich/glucklich
- **Arabic letter confusion** — ة/ه (قهوه = قهوة), ى/ي (مستشفي = مستشفى),
  hamza forms (أ/إ/آ = ا), tashkeel and tatweel stripped
- **Arabic prefixes & possessives** — والكلب، بالسيارة، كلبي، سيارتي all
  resolve to their stem
- **Broken plurals** — كلاب، قطط، أسود، أفيال
- **Stretched letters** — coooool → cool, ههههههه → 😂
- **Laughter in any language** — hahaha, jajaja, hehehe, mdr, لول
- **~90 common English misspellings** — freind, coffe, choclate, bananna,
  pinapple, avacado, spagetti, resturant...

## Dictionary coverage

~500 emojis in the base map, ~420 English synonyms/misspellings, and
per-language dictionaries (Arabic ~575 words, Spanish ~300, German ~285,
French ~270) spanning food & drink, animals, professions, places,
transport, sports, music, household objects, nature, and emotions.

## How it works

1. Input is split into letter runs with a Unicode-aware regex, so numbers
   and punctuation are left untouched.
2. Each word is normalized: lowercased, accents/diacritics stripped
   (NFD decomposition), ß → ss, ة/ه and ى/ي folded together.
3. Stretched letters are collapsed and repeated-letter laughter is
   detected directly.
4. Lookup order: the selected language's dictionary (stripping Arabic
   prefixes/suffixes or Latin plural endings as needed) → English base
   dictionary → English synonym/misspelling map → plural fallback.
5. Anything left unmatched is passed through as-is.

## Project structure

| File | Purpose |
|---|---|
| `index.html` | Page structure — language dropdown, input/output boxes, buttons |
| `style.css` | Styling and animations |
| `script.js` | Normalization, lookup, translation logic, and UI event handlers |
| `emoji-dictionary.js` | English word → emoji map, plus synonyms/misspellings |
| `lang-dictionaries.js` | Spanish, French, German, and Arabic word → English-key maps |

## Resources

- [Full Emoji List v12.0](https://unicode.org/emoji/charts/full-emoji-list.html)

## License

[MIT](LICENSE)
