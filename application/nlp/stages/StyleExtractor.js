/**
 * StyleExtractor
 * Extracts visual design styles from the normalized prompt by matching
 * against synonym dictionaries loaded from dictionaries/styles/.
 */
const fs = require('fs');
const path = require('path');
const { matchesWord } = require('./wordMatch');

class StyleExtractor {
  constructor(stylesDir) {
    stylesDir = stylesDir || path.join(__dirname, '..', 'dictionaries', 'styles');
    this.entries = [];

    if (fs.existsSync(stylesDir)) {
      fs.readdirSync(stylesDir)
        .filter(f => f.endsWith('.js'))
        .forEach(f => {
          const dict = require(path.join(stylesDir, f));
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

    promptAnalysis.styles = Array.from(found);
    return promptAnalysis;
  }
}

module.exports = StyleExtractor;
