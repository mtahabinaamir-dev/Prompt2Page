/**
 * ConfidenceScorer
 * Evaluates pipeline confidence based on extracted fields.
 * Mutates promptAnalysis.confidence with a value between 0.0 and 1.0.
 */
class ConfidenceScorer {
  process(promptAnalysis) {
    let score = 0.0;

    if (promptAnalysis.intent && promptAnalysis.intent !== 'UNKNOWN') {
      score += 0.35;
    }

    if (promptAnalysis.entities && promptAnalysis.entities.business) {
      score += 0.25;
    }

    if (promptAnalysis.styles) {
      score += promptAnalysis.styles.length * 0.05;
    }

    if (promptAnalysis.themes) {
      score += promptAnalysis.themes.length * 0.05;
    }

    if (promptAnalysis.constraints) {
      score += Object.keys(promptAnalysis.constraints).length * 0.05;
    }

    promptAnalysis.confidence = Math.min(score, 1.0);
    return promptAnalysis;
  }
}

module.exports = ConfidenceScorer;
