# Emoji Translator 😀

Translates text into an equivalent string of emojis. Words with a matching
emoji are replaced; everything else (numbers, punctuation, unknown words)
passes through unchanged.

## Running the app

It's a static site — open `index.html` in a browser, or serve the folder:

```bash
npx http-server -p 8642
```

## Features

- [x] Enter a string of words, numbers, and punctuation into a text box
- [x] Click **Translate** to convert words to their corresponding emojis
- [x] Warning message when **Translate** is clicked with an empty input or
      with text unchanged since the last translation
- [x] Translated output in a read-only text box; words with no emoji are
      left unchanged
- [x] Click **Clear** to reset both text boxes

### Bonus features

- [x] **Emoji synonyms** — ~420 synonym mappings widen coverage
      ("puppy" → 🐶, "hello" → 👋, "hungry" → 🍽️, "chef" → 🧑‍🍳)
- [x] **Input language dropdown** — English, Spanish, French, German, and
      Arabic, with per-language dictionaries, accent-insensitive matching
      (café/cafe, glücklich/glucklich), and RTL-aware text boxes
- [x] **Copy result** button with clipboard support

### Extra features

- [x] **⚡ Live mode** — translates as you type, no button needed
- [x] **🎲 Surprise me** — fills in a random example sentence per language
- [x] **Translation stats** — "✨ 5 of 8 words became emojis (63%)"
- [x] **Emoji celebration burst** on every successful translation
- [x] **Fun UI** — animated gradient, floating background emojis, wiggling
      logo, gradient title, shake animation on warnings; respects
      `prefers-reduced-motion`

### Forgiving spelling (especially Arabic)

- **Arabic letter confusion** handled by normalization: ة/ه (قهوه = قهوة),
  ى/ي (مستشفي = مستشفى), hamza forms (أ/إ/آ = ا), tashkeel and tatweel
  stripped
- **Attached prefixes**: والكلب، بالسيارة، للبيت all resolve to their stem
- **Possessive suffixes**: كلبي → 🐶, سيارتي → 🚗 (including the ة→ت shift)
- **Broken plurals**: كلاب، قطط، أسود، أفيال، مدارس...
- **Stretched letters**: ههههههه → 😂, cooooool → 😎
- **Laughter in any language**: hahaha, jajaja, hehehe, mdr, lol, لول, ههههه
- **~90 common English misspellings**: freind, coffe, choclate, bananna,
  pinapple, avacado, spagetti, resturant, calender...

### Dictionary size

~500 emojis in the base map, ~420 English synonyms/misspellings, and
per-language dictionaries: Arabic ~575 words, Spanish ~300, German ~285,
French ~270. Coverage spans food & drink (the full emoji pantry), animals,
professions, places, transport, sports, music, household objects, nature,
and emotions.

## How translation works

1. The input is split into letter runs using a Unicode-aware regex, so
   numbers and punctuation are untouched.
2. Each word is normalized: lowercased, accents and Arabic diacritics
   stripped (NFD decomposition), ß → ss, ة/ه and ى/ي folded together.
3. Stretched letters are collapsed (coooool → cool) and repeated-letter
   laughter is detected directly (hahaha, jajaja, ههههه → 😂).
4. Lookup order: selected language's dictionary (stripping Arabic
   prefixes/possessive suffixes or Latin plural endings as needed) →
   English base dictionary → English synonym/misspelling map → simple
   plural fallback. Loan words like "pizza" or "robot" translate in every
   language.
5. Words with no match are left as-is.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure: language dropdown, input/output boxes, buttons |
| `style.css` | Styling |
| `emoji-dictionary.js` | English word → emoji map + synonym map |
| `lang-dictionaries.js` | Spanish, French, German, Arabic word → English-key maps |
| `script.js` | Normalization, lookup, translation, and UI event handlers |

## Resources

[Full Emoji List v12.0](https://unicode.org/emoji/charts/full-emoji-list.html)

## License

MIT — see [LICENSE](LICENSE).
