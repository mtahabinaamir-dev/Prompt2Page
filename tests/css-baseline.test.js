/**
 * CSS compatibility baseline.
 *
 * Captured from the pre-refactor CSSRenderer. After restructuring VARIANTS
 * into scoped rule groups, render() must produce byte-identical output for
 * every fixture below. This is the compatibility contract for the
 * styleScopes work: site-wide rendering must not change.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CSSRenderer from '../application/rendering/CSSRenderer.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'css-baseline');

describe('CSS compatibility baseline', () => {
  const cases = [
    ['luxury', ['luxury']],
    ['cinematic', ['cinematic']],
    ['playful', ['playful']],
    ['minimalist', ['minimalist']],
    ['museum', ['museum']],
    ['retro', ['retro']],
    ['rustic', ['rustic']],
    ['colorful', ['colorful']],
    ['warm', ['warm']],
    ['oversized', ['oversized']],
    ['professional', ['professional']],
  ];

  it.each(cases)('variant %s renders byte-identical CSS', (name, variants) => {
    const expected = fs.readFileSync(path.join(DIR, `${name}.css`), 'utf8');
    expect(new CSSRenderer().render('', variants)).toBe(expected);
  });

  it('variant combinations render byte-identical CSS', () => {
    const expected = fs.readFileSync(path.join(DIR, 'combo-luxury-playful.css'), 'utf8');
    expect(new CSSRenderer().render('', ['luxury', 'playful'])).toBe(expected);
  });

  it('base styles render byte-identical CSS', () => {
    const expected = fs.readFileSync(path.join(DIR, 'base-only.css'), 'utf8');
    expect(new CSSRenderer().render('', [])).toBe(expected);
  });

  it('custom styles render byte-identical CSS', () => {
    const expected = fs.readFileSync(path.join(DIR, 'with-custom.css'), 'utf8');
    expect(new CSSRenderer().render('.foo { color: red; }', ['rustic'])).toBe(expected);
  });
});
