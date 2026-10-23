/**
 * Renderer tests — the guarantees a portfolio-grade generator must keep:
 * valid HTML tags, escaped user content, safe inline styles.
 *
 * Run: npx vitest run
 */
import { describe, it, expect } from 'vitest';
import HTMLRenderer from '../application/rendering/HTMLRenderer.js';
import {
  escapeHtml,
  normalizeHeadingLevel,
  renderInlineStyles,
} from '../application/utils/escapeHtml.js';

const renderer = new HTMLRenderer();

describe('escapeHtml', () => {
  it('neutralizes script injection', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });
  it('escapes quotes and ampersands', () => {
    expect(escapeHtml('a "b" & \'c\'')).toBe('a &quot;b&quot; &amp; &#39;c&#39;');
  });
  it('handles null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('normalizeHeadingLevel', () => {
  it('maps numeric levels to tags (1 → h1)', () => {
    expect(normalizeHeadingLevel(1)).toBe('h1');
    expect(normalizeHeadingLevel(3)).toBe('h3');
  });
  it('keeps valid tag strings', () => {
    expect(normalizeHeadingLevel('h2')).toBe('h2');
  });
  it('falls back to h2 for garbage', () => {
    expect(normalizeHeadingLevel(9)).toBe('h2');
    expect(normalizeHeadingLevel('banana')).toBe('h2');
    expect(normalizeHeadingLevel(null)).toBe('h2');
  });
});

describe('renderInlineStyles', () => {
  it('renders allowlisted properties', () => {
    expect(renderInlineStyles({ color: 'red', 'background-color': '#000' })).toBe(
      ' style="color: red; background-color: #000"'
    );
  });
  it('drops non-allowlisted properties', () => {
    expect(renderInlineStyles({ position: 'absolute', color: 'blue' })).toBe(
      ' style="color: blue"'
    );
  });
  it('rejects dangerous values', () => {
    expect(renderInlineStyles({ color: 'url(javascript:alert(1))' })).toBe('');
    expect(renderInlineStyles({ 'background-color': 'red; } body{display:none' })).toBe('');
  });
  it('returns empty for missing styles', () => {
    expect(renderInlineStyles(null)).toBe('');
    expect(renderInlineStyles({})).toBe('');
  });
});

describe('HTMLRenderer.renderComponent', () => {
  it('never emits numeric heading tags', () => {
    const html = renderer.renderComponent({ type: 'heading', level: 1, content: 'Hi' });
    expect(html).toContain('<h1');
    expect(html).not.toMatch(/<[0-9]/);
  });
  it('escapes user content in headings', () => {
    const html = renderer.renderComponent({ type: 'heading', level: 'h2', content: '<b>Hi</b>' });
    expect(html).toContain('&lt;b&gt;Hi&lt;/b&gt;');
    expect(html).not.toContain('<b>Hi</b>');
  });
  it('escapes image src and alt', () => {
    const html = renderer.renderComponent({ type: 'image', content: 'x" onerror="alert(1)', alt: '<x>' });
    expect(html).not.toContain('" onerror=');
    expect(html).toContain('&lt;x&gt;');
  });
  it('applies inline styles', () => {
    const html = renderer.renderComponent({
      type: 'paragraph', content: 'Hi', styles: { color: '#fff' },
    });
    expect(html).toContain('style="color: #fff"');
  });
  it('renders a full page without invalid tags', () => {
    const html = renderer.renderPage({
      project: { name: 'Test <Site>' },
      page: { name: 'Home', styles: { 'background-color': '#111' } },
      components: [
        { type: 'heading', level: 1, content: 'Welcome' },
        { type: 'paragraph', content: 'Hello <world>' },
      ],
    });
    expect(html).not.toMatch(/<[0-9][ />]/);
    expect(html).toContain('<h1 class="heading h1">Welcome</h1>');
    expect(html).toContain('Hello &lt;world&gt;');
    expect(html).toContain('Test &lt;Site&gt;');
    expect(html).toContain('<body style="background-color: #111">');
  });
});
