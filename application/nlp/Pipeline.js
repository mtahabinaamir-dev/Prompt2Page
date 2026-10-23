/**
 * Pipeline
 * Orchestrates NLP stages in sequential order.
 * Receives a PromptAnalysis instance and passes it through each stage.
 * No knowledge of intent, entities, styles, themes, or LLMs.
 */
class Pipeline {
  /**
   * @param {Array} [stages=[]] - Ordered list of stage instances.
   */
  constructor(stages = []) {
    this.stages = [...stages];
  }

  /**
   * Append a stage to the end of the pipeline.
   * @param {Object} stage - Must expose a process(promptAnalysis) method.
   */
  addStage(stage) {
    this.stages.push(stage);
  }

  /**
   * Execute all stages sequentially against the provided analysis.
   * Each stage receives and mutates the SAME PromptAnalysis instance.
   *
   * @param {PromptAnalysis} promptAnalysis
   * @returns {PromptAnalysis}
   */
  execute(promptAnalysis) {
    for (const stage of this.stages) {
      stage.process(promptAnalysis);
    }
    return promptAnalysis;
  }
}

module.exports = Pipeline;
