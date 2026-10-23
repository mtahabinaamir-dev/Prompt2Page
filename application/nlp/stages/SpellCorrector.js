/**
 * SpellCorrector
 *
 * Corrects obvious typos ("resturant" → "restaurant", "webiste" → "website")
 * using Levenshtein distance against the vocabularies that actually matter
 * for understanding: intent verbs/objects, business synonyms, styles, themes.
 *
 * Safety rules (a corrector must never mangle valid input):
 *   - words already in the vocabulary are left alone
 *   - common English words are protected and never "corrected"
 *   - words of 3 chars or fewer are never corrected
 *   - quoted spans ("Teest", brand names) are never corrected
 *   - the best candidate must be strictly closer than the runner-up
 *     (no ambiguous corrections like "image" → "make")
 *   - max distance: 1 for short words, 2 for words of 6+ chars
 */
const path = require('path');

// Words the corrector must never touch. Covered: articles, pronouns,
// prepositions, conjunctions, common verbs/adjectives/nouns users type.
const PROTECTED = new Set(
  (
    'a an the and or but if then than that this these those it its it\'s i me my ' +
    'we us our you your he she they them his her their this that what which who ' +
    'is are was were be been being do does did don\'t doesn\'t isn\'t aren\'t ' +
    'can could should would will won\'t not no yes please thanks thank ' +
    'for of to in on at with from by as like into out up down over under ' +
    'my mine your yours our ours site page section image images picture ' +
    'pictures photo photos headline heading title text button link menu ' +
    'color colors colour colours font background warmer cooler darker lighter ' +
    'bigger smaller bold italic big small dark light new old top bottom ' +
    'first second third last above below before after here there now then ' +
    'add delete remove move change make take put get set keep drop undo redo ' +
    'hi hello hey want need like don\'t doesn\'t ' +
    // Valid English words that sit one typo away from vocabulary words and
    // must never be "corrected" ("test"/"tent" → "text" mangled page names;
    // "more" → "move" broke restyle commands; "five" → "file" broke counts).
    'test tests testing tent more one two three four five six seven eight nine ten ' +
    // "layout" → "about" hijacked restyle commands into a section scope;
    // "footer" → "cooler" mangled section names.
    'layout layouts footer header navbar sidebar'
  ).split(' ')
);

class SpellCorrector {
  constructor(dictionaryDir) {
    dictionaryDir = dictionaryDir || path.join(__dirname, '..', 'dictionaries');
    this.vocabulary = new Set();
    this._loadVocabulary(dictionaryDir);
  }

  _loadVocabulary(dictionaryDir) {
    const add = (w) => {
      const s = String(w).toLowerCase().trim();
      if (s) this.vocabulary.add(s);
    };

    // Intent verbs / objects / anti-words
    try {
      const intents = require(path.join(dictionaryDir, 'intents.js'));
      for (const groups of Object.values(intents)) {
        for (const key of ['verbs', 'objects', 'anti']) {
          for (const phrase of groups[key] || []) {
            phrase.split(' ').forEach(add);
          }
        }
      }
    } catch (e) { /* taxonomy optional */ }

    // Entity synonyms
    try {
      const fs = require('fs');
      const entitiesDir = path.join(dictionaryDir, 'entities');
      if (fs.existsSync(entitiesDir)) {
        for (const f of fs.readdirSync(entitiesDir).filter((x) => x.endsWith('.js'))) {
          const dict = require(path.join(entitiesDir, f));
          for (const synonyms of Object.values(dict)) {
            for (const syn of synonyms) String(syn).toLowerCase().split(' ').forEach(add);
          }
        }
      }
    } catch (e) { /* entities optional */ }

    // Flat style / theme / website-type lists
    for (const f of ['styles.js', 'themes.js', 'websiteTypes.js', 'actions.js']) {
      try {
        const list = require(path.join(dictionaryDir, f));
        if (Array.isArray(list)) list.forEach(add);
      } catch (e) { /* optional */ }
    }

    // Style / theme canonical names (dictionaries keyed by canonical name).
    // Lets typos like "luxary" correct to "luxury" instead of vanishing.
    for (const f of ['styles/designStyles.js', 'themes/conceptualThemes.js']) {
      try {
        const dict = require(path.join(dictionaryDir, f));
        if (dict && typeof dict === 'object' && !Array.isArray(dict)) {
          Object.keys(dict).forEach(add);
        }
      } catch { /* optional */ }
    }
  }

  process(promptAnalysis) {
    // Quoted spans are deliberate custom labels ("Teest", brand names) —
    // never spell-correct inside them.
    const segments = String(promptAnalysis.normalizedPrompt).split(/("[^"]*"|'[^']*')/g);
    const corrected = segments.map((segment, i) =>
      i % 2 === 1 ? segment : segment.split(' ').map((word) => this._correctWord(word)).join(' ')
    );

    promptAnalysis.normalizedPrompt = corrected.join('');
    return promptAnalysis;
  }

  _correctWord(word) {
    if (this._isProtected(word)) return word;
    const lower = word.toLowerCase();
    if (this.vocabulary.has(lower)) return word;
    if (lower.length <= 3) return word;

    let best = null;
    let bestDist = Infinity;
    let secondDist = Infinity;

    for (const candidate of this.vocabulary) {
      // Cheap pre-filter: lengths must be close.
      if (Math.abs(candidate.length - lower.length) > 2) continue;
      const dist = this._levenshtein(lower, candidate);
      if (dist < bestDist) {
        secondDist = bestDist;
        bestDist = dist;
        best = candidate;
      } else if (dist < secondDist) {
        secondDist = dist;
      }
    }

    const maxDist = lower.length <= 5 ? 1 : 2;
    // Correct only on a clear, unambiguous winner.
    if (best && bestDist <= maxDist && bestDist < secondDist) return best;
    return word;
  }

  _isProtected(word) {
    const lower = word.toLowerCase();
    return (
      PROTECTED.has(lower) ||
      /^\d+$/.test(word) || // numbers
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(word) || // emails
      /^https?:\/\//.test(word) || // URLs
      /\.\w{2,6}$/.test(word) // filenames
    );
  }

  _levenshtein(a, b) {
    if (a === b) return 0;
    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        m[i][j] =
          b[i - 1] === a[j - 1]
            ? m[i - 1][j - 1]
            : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
      }
    }
    return m[b.length][a.length];
  }
}

module.exports = SpellCorrector;
