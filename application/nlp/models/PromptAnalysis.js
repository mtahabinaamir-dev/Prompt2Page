/**
 * PromptAnalysis
 * Mutable aggregate model that holds the complete result of NLP pipeline processing.
 * Each pipeline stage enriches this instance in sequence.
 */
class PromptAnalysis {
  /**
   * @param {Object} [init={}]
   */
  constructor(init = {}) {
    this.rawPrompt = init.rawPrompt || '';
    this.normalizedPrompt = init.normalizedPrompt || '';
    this.intent = init.intent || null;
    this.entities = init.entities || [];
    this.styles = init.styles || [];
    this.themes = init.themes || [];
    this.constraints = init.constraints || [];
    this.confidence = init.confidence || null;
    this.provider = init.provider || null;
  }

  /**
   * Factory: create an empty analysis seeded with the raw user prompt.
   * @param {string} prompt
   * @returns {PromptAnalysis}
   */
  static empty(prompt) {
    return new PromptAnalysis({ rawPrompt: prompt });
  }

  /**
   * Create a deep copy of this analysis.
   * @returns {PromptAnalysis}
   */
  clone() {
    return new PromptAnalysis({
      rawPrompt: this.rawPrompt,
      normalizedPrompt: this.normalizedPrompt,
      intent: this.intent,
      entities: [...this.entities],
      styles: [...this.styles],
      themes: [...this.themes],
      constraints: [...this.constraints],
      confidence: this.confidence,
      provider: this.provider,
    });
  }

  /**
   * Serialize to a plain JSON object.
   * @returns {Object}
   */
  toJSON() {
    return {
      rawPrompt: this.rawPrompt,
      normalizedPrompt: this.normalizedPrompt,
      intent: this.intent,
      entities: this.entities,
      styles: this.styles,
      themes: this.themes,
      constraints: this.constraints,
      confidence: this.confidence,
      provider: this.provider,
    };
  }
}

module.exports = PromptAnalysis;
