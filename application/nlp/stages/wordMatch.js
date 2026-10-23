/**
 * wordMatch
 *
 * Shared matcher for the NLP dictionary extractors. Matches a synonym as a
 * whole word/phrase inside the normalized prompt — never as a substring of
 * another word ("drawn" must not match "raw", "accents" must not match "en").
 */
function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesWord(prompt, synonym) {
  const syn = String(synonym || '').toLowerCase().trim();
  if (!syn) return false;
  return new RegExp(`\\b${escapeRegExp(syn)}\\b`).test(String(prompt || '').toLowerCase());
}

module.exports = { matchesWord, escapeRegExp };
