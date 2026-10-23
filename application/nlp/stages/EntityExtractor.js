/**
 * EntityExtractor
 * Extracts structured entities from the normalized prompt by matching
 * against synonym dictionaries loaded from application/nlp/dictionaries/entities/.
 */
const fs = require('fs');
const path = require('path');

class EntityExtractor {
  constructor(entitiesDir) {
    entitiesDir = entitiesDir || path.join(__dirname, '..', 'dictionaries', 'entities');
    this.maps = {};

    if (fs.existsSync(entitiesDir)) {
      fs.readdirSync(entitiesDir)
        .filter(f => f.endsWith('.js'))
        .forEach(f => {
          const category = path.basename(f, '.js');
          const dict = require(path.join(entitiesDir, f));
          const entries = [];
          for (const [canonical, synonyms] of Object.entries(dict)) {
            for (const syn of synonyms) {
              entries.push({ canonical, synonym: syn.toLowerCase() });
            }
          }
          entries.sort((a, b) => b.synonym.length - a.synonym.length);
          this.maps[category] = entries;
        });
    }
  }

  process(promptAnalysis) {
    const prompt = promptAnalysis.normalizedPrompt;
    const found = {};

    for (const [category, entries] of Object.entries(this.maps)) {
      for (const entry of entries) {
        if (prompt.includes(entry.synonym)) {
          found[category] = entry.canonical;
          break;
        }
      }
    }

    promptAnalysis.entities = found;
    return promptAnalysis;
  }
}

module.exports = EntityExtractor;
