const PromptAnalysis = require('./models/PromptAnalysis');
const Pipeline = require('./Pipeline');
const PromptNormalizer = require('./stages/PromptNormalizer');
const SpellCorrector = require('./stages/SpellCorrector');
const IntentClassifier = require('./stages/IntentClassifier');
const EntityExtractor = require('./stages/EntityExtractor');
const StyleExtractor = require('./stages/StyleExtractor');
const ThemeExtractor = require('./stages/ThemeExtractor');
const ConstraintExtractor = require('./stages/ConstraintExtractor');
const ConfidenceScorer = require('./stages/ConfidenceScorer');

/**
 * NLPEngine
 * Single entry point for natural language understanding.
 * Orchestrates all NLP stages through the Pipeline.
 * Contains zero NLP logic — only wiring.
 */
class NLPEngine {
  constructor() {
    this.pipeline = new Pipeline([
      new PromptNormalizer(),
      new SpellCorrector(),
      new StyleExtractor(),
      new ThemeExtractor(),
      new IntentClassifier(),
      new EntityExtractor(),
      new ConstraintExtractor(),
      new ConfidenceScorer()
    ]);
  }

  /**
   * Analyze a raw user prompt through the full NLP pipeline.
   * @param {string} prompt
   * @returns {PromptAnalysis}
   */
  analyze(prompt) {
    const analysis = PromptAnalysis.empty(prompt);
    this.pipeline.execute(analysis);
    return analysis;
  }
}

module.exports = NLPEngine;
