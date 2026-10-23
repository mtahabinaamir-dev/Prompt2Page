/**
 * escapeHtml — escape user-controlled text before it reaches generated HTML.
 *
 * Every piece of text a user types (headings, button labels, project names)
 * ends up in a generated page. Without escaping, a "<script>" in a headline
 * becomes live JavaScript in every visitor's browser (stored XSS).
 * This is applied at the rendering boundary, so no caller can forget it.
 */
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalize a heading level to a valid h1–h6 tag name.
 * Accepts numbers (1), strings ("h2"), garbage ("7", null) → always valid.
 */
function normalizeHeadingLevel(level) {
  if (typeof level === 'number' && Number.isInteger(level)) {
    level = `h${level}`;
  }
  const tag = String(level || 'h2').toLowerCase();
  return /^h[1-6]$/.test(tag) ? tag : 'h2';
}

/**
 * Render a component's inline style object as a style attribute value.
 * Only allowlisted CSS properties pass through — never raw user CSS.
 */
const ALLOWED_STYLE_PROPS = new Set([
  'background',
  'background-color',
  'color',
  'font-size',
  'font-family',
  'font-weight',
  'text-align',
  'padding',
  'margin',
  'border-radius',
]);

function renderInlineStyles(styles) {
  if (!styles || typeof styles !== 'object') return '';
  const parts = [];
  for (const [prop, value] of Object.entries(styles)) {
    // Normalize camelCase (e.g. backgroundColor from theme definitions) to
    // kebab-case before the allowlist check, so both forms are accepted.
    const p = String(prop).trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    const v = String(value).trim();
    // Reject anything that isn't a plain property/value — no url(), no expressions.
    if (!ALLOWED_STYLE_PROPS.has(p)) continue;
    if (/[<>;"'{}]/.test(v) || /url\s*\(|expression\s*\(|javascript:/i.test(v)) continue;
    parts.push(`${p}: ${v}`);
  }
  return parts.length ? ` style="${escapeHtml(parts.join('; '))}"` : '';
}

module.exports = { escapeHtml, normalizeHeadingLevel, renderInlineStyles };
