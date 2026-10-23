/**
 * ConstraintExtractor
 * Extracts implementation constraints from the normalized prompt
 * by matching against typed dictionaries loaded from dictionaries/constraints/.
 */
const fs = require('fs');
const path = require('path');
const { matchesWord } = require('./wordMatch');

class ConstraintExtractor {
  constructor(constraintsDir) {
    constraintsDir = constraintsDir || path.join(__dirname, '..', 'dictionaries', 'constraints');
    this.dictionaries = [];

    if (fs.existsSync(constraintsDir)) {
      fs.readdirSync(constraintsDir)
        .filter(f => f.endsWith('.js'))
        .forEach(f => {
          this.dictionaries.push(require(path.join(constraintsDir, f)));
        });
    }
  }

  process(promptAnalysis) {
    const prompt = promptAnalysis.normalizedPrompt;
    const constraints = {};

    for (const dict of this.dictionaries) {
      if (dict.type === 'string') {
        for (const [canonical, synonyms] of Object.entries(dict.values)) {
          for (const syn of synonyms) {
            if (matchesWord(prompt, syn)) {
              constraints[dict.key] = canonical;
              break;
            }
          }
        }
      }

      if (dict.type === 'boolean') {
        for (const [key, synonyms] of Object.entries(dict.entries)) {
          for (const syn of synonyms) {
            if (matchesWord(prompt, syn)) {
              constraints[key] = true;
              break;
            }
          }
        }
      }

      if (dict.type === 'array') {
        const found = [];
        for (const [canonical, synonyms] of Object.entries(dict.values)) {
          for (const syn of synonyms) {
            if (matchesWord(prompt, syn)) {
              found.push(canonical);
              break;
            }
          }
        }
        if (found.length > 0) {
          constraints[dict.key] = found;
        }
      }
    }

    const pageMatch = prompt.match(/(\d+)\s*pages?/);
    if (pageMatch) {
      constraints.pageCount = parseInt(pageMatch[1], 10);
    } else {
      // Word forms: "one-page website", "three page bakery", "exactly five pages".
      const wordNumbers = {
        one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      };
      const wordMatch = prompt.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|single)[-\s]?pages?\b/);
      if (wordMatch) {
        const w = wordMatch[1];
        constraints.pageCount = w === 'single' ? 1 : wordNumbers[w];
      }
    }

    promptAnalysis.constraints = constraints;
    return promptAnalysis;
  }
}

module.exports = ConstraintExtractor;
