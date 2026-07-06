const inputBox = document.getElementById("input-text");
const outputBox = document.getElementById("output-text");
const translateBtn = document.getElementById("translate-btn");
const surpriseBtn = document.getElementById("surprise-btn");
const clearBtn = document.getElementById("clear-btn");
const copyBtn = document.getElementById("copy-btn");
const warningEl = document.getElementById("warning");
const statsEl = document.getElementById("stats");
const languageSelect = document.getElementById("language");
const liveToggle = document.getElementById("live-toggle");
const burstLayer = document.getElementById("burst-layer");
const bgEmojis = document.getElementById("bg-emojis");

const PLACEHOLDERS = {
  en: "e.g. I love pizza and my dog makes me happy",
  es: "p. ej. Me encanta la pizza y mi perro me hace feliz",
  fr: "p. ex. J'adore la pizza et mon chien me rend heureux",
  de: "z. B. Ich liebe Pizza und mein Hund macht mich glücklich",
  ar: "مثال: أحب البيتزا وكلبي يجعلني سعيد",
};

const EXAMPLES = {
  en: [
    "I love pizza and my dog makes me happy",
    "The sun, the beach and an icecream — what a day!",
    "My cat sleeps like a baby every night",
    "Coffee, music and a good book under a tree",
    "We saw a lion, an elephant and a giraffe!",
    "hahaha my freind ate 3 cookies and a bananna",
    "Sushi, tacos, avocado and soup for dinner, delicious!",
    "The doctor and the teacher took the train to the hotel",
  ],
  es: [
    "Me encanta el café y mi perro",
    "El sol, la playa y un helado",
    "Mi gato duerme como un bebé",
    "Pizza, música y amigos en la fiesta, jajaja",
  ],
  fr: [
    "J'adore le café et mon chien",
    "Le soleil, la plage et une glace",
    "Mon chat dort comme un bébé, mdr",
    "Pizza, musique et amis à la fête",
  ],
  de: [
    "Ich liebe Kaffee und meinen Hund",
    "Die Sonne, der Strand und ein Eis",
    "Meine Katze schläft wie ein Baby",
    "Pizza, Musik und Freunde auf der Party",
  ],
  ar: [
    "أحب القهوة وقطتي في الصباح",
    "الشمس والبحر والمثلجات، يوم جميل",
    "كلبي ينام مثل الطفل كل ليلة",
    "بيتزا وموسيقى وأصدقاء في الحفلة ههههه",
    "رأيت أسداً وفيلاً وزرافة في الرحلة",
    "شاورما وفلافل وعصير في المطعم مع الاصدقاء، لذيذ",
    "الطبيب والمعلم ركبوا القطار الى الفندق",
  ],
};

let lastTranslated = null; // "<lang> <text>" of the last button translation

// ---------------------------------------------------------------------------
// Normalization & lookup
// ---------------------------------------------------------------------------

// Normalize for lookup: lowercase, ß -> ss, strip accents/diacritics via NFD
// (café -> cafe, glücklich -> glucklich, hamza forms أإآ -> ا, tashkeel
// removed), drop Arabic tatweel, and fold the letters Arabic writers mix up
// most: ة -> ه (قهوة/قهوه) and ى -> ي (مستشفى/مستشفي).
function normalize(word) {
  return word
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/ـ/g, "")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

// Dictionaries are written with human-friendly spellings (قهوة, café...),
// so build indexes keyed by their normalized forms once at startup.
function buildNormDict(dict) {
  const out = {};
  for (const [key, value] of Object.entries(dict)) {
    out[normalize(key)] = value;
  }
  return out;
}
const NORM_LANG_DICTS = Object.fromEntries(
  Object.entries(LANG_DICTS).map(([lang, dict]) => [lang, buildNormDict(dict)])
);

// Collapse letters stretched for emphasis: "coooool" -> "cool"/"col",
// "ههههههه" -> "هه"/"ه". Only runs of 3+ are touched, so normal double
// letters ("happy", "coffee") are safe.
function collapseRuns(word, keep) {
  return word.replace(/(.)\1{2,}/gu, (run, ch) => ch.repeat(keep));
}

// Laughter in any language: hahaha, jajaja, hehehe, ههههه, هاهاها...
const LAUGHTER = /^(?:(?:ha){2,}h?|(?:ja){2,}|(?:he){2,}h?|ه{2,}|(?:ها){2,}ه?)$/u;

// English key -> emoji, checking the base map then synonyms/misspellings.
function resolveEnglish(key) {
  if (EMOJI_MAP[key]) return EMOJI_MAP[key];
  if (SYNONYM_MAP[key]) return EMOJI_MAP[SYNONYM_MAP[key]] ?? null;
  return null;
}

const AR_PREFIXES = "وفبكل"; // and / so / with / like / for
const AR_SUFFIXES = ["ها", "هم", "كم", "نا", "ي", "ك", "ه"]; // possessives

// All the forms a word might reduce to in the selected language:
// full word first, then with prefixes/articles/plurals/suffixes stripped.
function candidatesFor(key, lang) {
  const out = [key];
  const push = (c) => {
    if (c && !out.includes(c)) out.push(c);
  };

  if (lang === "ar") {
    // Attached prefixes: والكلب -> الكلب, بالبيت -> البيت, للبيت -> بيت
    const bases = [key];
    if (AR_PREFIXES.includes(key[0]) && key.length > 2) bases.push(key.slice(1));
    const stems = [];
    for (const base of bases) {
      push(base);
      stems.push(base);
      if (base.startsWith("ال") && base.length > 3) {
        push(base.slice(2));
        stems.push(base.slice(2));
      } else if (base.startsWith("لل") && base.length > 3) {
        push(base.slice(2));
        stems.push(base.slice(2));
      }
    }
    // Possessive suffixes: كلبي (my dog) -> كلب. Feminine ة becomes ت
    // before a suffix (سيارتي), and normalize turned ة into ه, so also
    // try swapping a trailing ت back: سيارتي -> سيارت -> سياره.
    for (const stem of stems) {
      for (const suffix of AR_SUFFIXES) {
        if (stem.endsWith(suffix) && stem.length - suffix.length >= 2) {
          const bare = stem.slice(0, -suffix.length);
          push(bare);
          if (bare.endsWith("ت")) push(bare.slice(0, -1) + "ه");
        }
      }
    }
  } else {
    // Plural endings; keep at least 3 letters so short function words
    // ("ein" -> "ei") don't false-match.
    const strip = (n, base = key) => {
      const stem = base.slice(0, -n);
      if (stem.length >= 3) push(stem);
    };
    if (key.endsWith("es")) strip(2);
    if (key.endsWith("s")) strip(1);
    if (lang === "de") {
      if (key.endsWith("en")) strip(2);
      if (key.endsWith("n") || key.endsWith("e")) strip(1);
    }
  }
  return out;
}

function emojiForWord(word, lang) {
  const key = normalize(word);
  if (LAUGHTER.test(key)) return "😂";

  // Base forms: as typed, plus de-stretched variants (goooal -> goal).
  const bases = [key];
  const collapsed2 = collapseRuns(key, 2);
  const collapsed1 = collapseRuns(key, 1);
  if (collapsed2 !== key) bases.push(collapsed2);
  if (collapsed1 !== collapsed2) bases.push(collapsed1);

  const dict = lang !== "en" ? NORM_LANG_DICTS[lang] : null;
  if (dict) {
    for (const base of bases) {
      if (LAUGHTER.test(base)) return "😂";
      for (const candidate of candidatesFor(base, lang)) {
        const englishKey = dict[candidate];
        if (englishKey) {
          const emoji = resolveEnglish(englishKey);
          if (emoji) return emoji;
        }
      }
    }
  }

  // English lookup — the base dictionary, synonyms, and misspellings work
  // in every language, so loan words like "pizza" always translate.
  for (const base of bases) {
    const candidates = [base];
    if (base.endsWith("es") && base.length > 4) candidates.push(base.slice(0, -2));
    if (base.endsWith("s") && base.length > 3) candidates.push(base.slice(0, -1));
    for (const candidate of candidates) {
      const emoji = resolveEnglish(candidate);
      if (emoji) return emoji;
    }
  }
  return null;
}

// Replace letter runs only, so numbers, punctuation, and whitespace pass
// through unchanged; also count matches for the stats line.
function translateWithStats(text, lang) {
  let total = 0;
  let matched = 0;
  const output = text.replace(/[\p{L}\p{M}]+/gu, (word) => {
    total++;
    const emoji = emojiForWord(word, lang);
    if (emoji) {
      matched++;
      return emoji;
    }
    return word;
  });
  return { output, total, matched };
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

function showWarning(message) {
  warningEl.textContent = message;
  warningEl.hidden = false;
  warningEl.classList.remove("shake");
  void warningEl.offsetWidth; // restart the animation
  warningEl.classList.add("shake");
}

function hideWarning() {
  warningEl.hidden = true;
}

function showStats(matched, total) {
  if (total === 0) {
    statsEl.hidden = true;
    return;
  }
  const pct = Math.round((matched / total) * 100);
  statsEl.textContent =
    matched === 0
      ? "🤔 No words matched — try “cat”, “sun”, or hit 🎲 Surprise me"
      : `✨ ${matched} of ${total} words became emojis (${pct}%)`;
  statsEl.hidden = false;
}

// Float the translated emojis up the screen for a little celebration.
function burst(text) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const emojis = [...new Set(text.match(/\p{Extended_Pictographic}/gu) ?? [])];
  emojis.slice(0, 12).forEach((emoji, i) => {
    const span = document.createElement("span");
    span.className = "burst-emoji";
    span.textContent = emoji;
    span.style.left = `${8 + Math.random() * 84}%`;
    span.style.animationDelay = `${i * 70}ms`;
    span.style.fontSize = `${1.4 + Math.random() * 1.2}rem`;
    burstLayer.appendChild(span);
    setTimeout(() => span.remove(), 2200 + i * 70);
  });
}

function runTranslation({ silent } = {}) {
  const text = inputBox.value.trim();
  const lang = languageSelect.value;

  if (text === "") {
    if (silent) {
      outputBox.value = "";
      statsEl.hidden = true;
      return;
    }
    showWarning("⚠️ Please enter some text to translate.");
    return;
  }

  if (!silent) {
    const stamp = `${lang} ${text}`;
    if (stamp === lastTranslated) {
      showWarning("⚠️ This text was already translated. Change it and try again.");
      return;
    }
    lastTranslated = stamp;
  }

  hideWarning();
  const { output, total, matched } = translateWithStats(text, lang);
  outputBox.value = output;
  showStats(matched, total);
  if (!silent && matched > 0) burst(output);
}

translateBtn.addEventListener("click", () => runTranslation());

surpriseBtn.addEventListener("click", () => {
  const examples = EXAMPLES[languageSelect.value] ?? EXAMPLES.en;
  const pool = examples.filter((example) => example !== inputBox.value);
  inputBox.value = pool[Math.floor(Math.random() * pool.length)];
  runTranslation();
});

clearBtn.addEventListener("click", () => {
  inputBox.value = "";
  outputBox.value = "";
  lastTranslated = null;
  hideWarning();
  statsEl.hidden = true;
  inputBox.focus();
});

copyBtn.addEventListener("click", async () => {
  if (outputBox.value === "") {
    showWarning("⚠️ Nothing to copy yet — translate something first.");
    return;
  }
  hideWarning();
  try {
    await navigator.clipboard.writeText(outputBox.value);
  } catch {
    outputBox.select();
    document.execCommand("copy");
  }
  const original = copyBtn.textContent;
  copyBtn.textContent = "✅ Copied!";
  setTimeout(() => (copyBtn.textContent = original), 1500);
});

languageSelect.addEventListener("change", () => {
  inputBox.placeholder = PLACEHOLDERS[languageSelect.value] ?? PLACEHOLDERS.en;
  hideWarning();
  if (liveToggle.checked) runTranslation({ silent: true });
});

inputBox.addEventListener("input", () => {
  if (liveToggle.checked) runTranslation({ silent: true });
});

liveToggle.addEventListener("change", () => {
  if (liveToggle.checked) runTranslation({ silent: true });
});

// Ambient floating emojis behind the card.
(function seedBackground() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const set = ["😀", "🎉", "🍕", "🐶", "🌈", "⭐", "❤️", "🚀", "🎈", "🌸", "🎵", "☀️"];
  set.forEach((emoji, i) => {
    const span = document.createElement("span");
    span.textContent = emoji;
    span.style.left = `${(i / set.length) * 100 + Math.random() * 5}%`;
    span.style.animationDuration = `${14 + Math.random() * 14}s`;
    span.style.animationDelay = `${-Math.random() * 20}s`;
    span.style.fontSize = `${1.2 + Math.random() * 1.6}rem`;
    bgEmojis.appendChild(span);
  });
})();
