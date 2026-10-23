/**
 * PromptNormalizer
 * Performs safe text normalization on the raw user prompt.
 * Mutates the provided PromptAnalysis instance.
 */
class PromptNormalizer {
  process(promptAnalysis) {
    let text = promptAnalysis.rawPrompt;

    // Remove invisible/control characters
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    // Normalize Unicode composition
    text = text.normalize('NFC');

    // Replace fancy quotes, dashes, and ellipsis with simple equivalents
    text = text
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2013\u2014\u2015]/g, '-')
      .replace(/\u2026/g, '...');

    // Strip HTML/XML tags — markup in the input must never pollute
    // classification (e.g. "<b>bold</b>" triggering the EDIT_STYLE
    // "bold" pattern) or reach the keyword scorer as words.
    text = text.replace(/<[^>]*>/g, ' ');

    // Collapse multiple whitespace characters into a single space
    text = text.replace(/\s+/g, ' ');

    // Convert to lowercase
    text = text.toLowerCase();

    // Collapse repeated punctuation (preserve periods for ellipsis intent)
    text = text.replace(/([!?,;:-])\1+/g, '$1');

    promptAnalysis.normalizedPrompt = text.trim();
    return promptAnalysis;
  }
}

module.exports = PromptNormalizer;
