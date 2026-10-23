/**
 * ThemeExtractor
 * Extracts conceptual inspiration themes from the normalized prompt
 * by matching against synonym dictionaries loaded from dictionaries/themes/.
 */
const fs = require('fs');
const path = require('path');
const { matchesWord } = require('./wordMatch');

class ThemeExtractor {
  constructor(themesDir) {
    themesDir = themesDir || path.join(__dirname, '..', 'dictionaries', 'themes');
    this.entries = [];

    if (fs.existsSync(themesDir)) {
      fs.readdirSync(themesDir)
        .filter(f => f.endsWith('.js'))
        .forEach(f => {
          const dict = require(path.join(themesDir, f));
          for (const [canonical, synonyms] of Object.entries(dict)) {
            for (const syn of synonyms) {
              this.entries.push({ canonical, synonym: syn.toLowerCase() });
            }
          }
        });
    }

    this.entries.sort((a, b) => b.synonym.length - a.synonym.length);
  }

  process(promptAnalysis) {
    const prompt = promptAnalysis.normalizedPrompt;
    const found = new Set();

    for (const entry of this.entries) {
      if (matchesWord(prompt, entry.synonym)) {
        found.add(entry.canonical);
      }
    }

    promptAnalysis.themes = Array.from(found);
    return promptAnalysis;
  }
}

module.exports = ThemeExtractor;
