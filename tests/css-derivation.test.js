/**
 * CSS rule-derivation hardening tests.
 *
 * getTypeCss derives button/card rules from variant CSS with a deliberately
 * simple parser. These tests pin down (a) that derivation never pulls in
 * unrelated rules on tricky synthetic CSS, and (b) the documented
 * simple-rules constraint that all CURRENT variants satisfy — if a future
 * variant adds at-rules, string braces, or comma-bearing functional
 * selectors, the constraint tests fail and the parser must be upgraded
 * before that variant ships.
 */
import { describe, it, expect } from 'vitest';
import CSSRenderer from '../application/rendering/CSSRenderer.js';

const r = new CSSRenderer();
const derive = (css, type) => r._deriveTypeRules(css, type);

describe('derivation on tricky synthetic CSS', () => {
  it('extracts plain, pseudo-class, and descendant-of-type rules', () => {
    const css = [
      '.btn { color: red; }',
      '.btn:hover, .btn:focus { color: blue; }',
      '.btn .icon { fill: white; }',
      '.card:nth-child(odd) { border-top: 4px solid gold; }',
    ].join('\n');
    const btn = derive(css, 'button');
    expect(btn).toContain('.btn { color: red; }');
    expect(btn).toContain('.btn:hover, .btn:focus { color: blue; }');
    expect(btn).toContain('.btn .icon { fill: white; }');
    expect(btn).not.toContain('nth-child');
    expect(derive(css, 'card')).toContain('.card:nth-child(odd)');
  });

  it('does not leak suffixed classes (.btn-primary, .btn2, .card-body)', () => {
    const css = [
      '.btn-primary { color: red; }',
      '.btn2 { color: red; }',
      '.card-body { color: red; }',
      '.cardinal { color: red; }',
    ].join('\n');
    expect(derive(css, 'button')).toBe('');
    expect(derive(css, 'card')).toBe('');
  });

  it('mixed selector lists are extracted for NEITHER type', () => {
    const css = [
      '.btn, .card { shared: yes; }',
      'h1, .btn { shared: yes; }',
      '.btn, .navbar { shared: yes; }',
    ].join('\n');
    expect(derive(css, 'button')).toBe('');
    expect(derive(css, 'card')).toBe('');
  });

  it('descendant rules belong to their FIRST compound only', () => {
    const css = [
      '.card .btn { color: red; }',
      '.navbar .btn { color: blue; }',
    ].join('\n');
    expect(derive(css, 'button')).toBe('');
    expect(derive(css, 'card')).toContain('.card .btn');
  });

  it('at-rules are skipped without corrupting neighboring rules', () => {
    const css = [
      '.btn { color: red; }',
      '@media (max-width: 600px) { .btn { padding: 0; } }',
      '.btn { margin: 0; }',
    ].join('\n');
    const btn = derive(css, 'button');
    expect(btn).not.toContain('@media');
    expect(btn).toContain('.btn { color: red; }');
    expect(btn).toContain('.btn { margin: 0; }');
    // The media-wrapped rule is dropped (documented constraint), not leaked.
    expect(btn).not.toContain('padding: 0');
  });

  it('commas inside declarations do not break selector parsing', () => {
    const css = ".btn { font-family: Georgia, 'Times New Roman', serif; }";
    expect(derive(css, 'button')).toContain('font-family: Georgia');
  });

  it('section scoping of tricky CSS emits no at-rule garbage', () => {
    const css = '@media (max-width: 600px) { .btn { padding: 0; } }\n.btn { color: red; }';
    const scoped = r._scopeCssToSection(css, 'hero');
    expect(scoped).not.toContain('@media');
    expect(scoped).toContain('[data-section="hero"] .btn { color: red; }');
  });
});

describe('documented simple-rules constraint holds for every shipped variant', () => {
  const names = Object.keys(CSSRenderer.VARIANTS);

  it.each(names)('%s: no at-rules', (name) => {
    expect(r._variantCss(name)).not.toContain('@');
  });

  it.each(names)('%s: parser sees every rule exactly once (no brace-in-string)', (name) => {
    const css = r._variantCss(name);
    const rules = r._parseRules(css);
    expect(rules.length).toBe((css.match(/\{/g) || []).length);
    for (const rule of rules) {
      expect(rule.decls).not.toContain('{');
      expect(rule.selectors.length).toBeGreaterThan(0);
    }
  });

  it.each(names)('%s: no comma-bearing functional selectors', (name) => {
    expect(r._variantCss(name)).not.toMatch(/:(not|is|has)\([^)]*,/);
  });

  it.each(names)('%s: derived button/card rules contain only that type at a boundary', (name) => {
    for (const type of ['button', 'card']) {
      const out = r.getTypeCss(name, type);
      if (!out) continue;
      for (const line of out.split('\n')) {
        const sels = line.split('{')[0].split(',').map(s => s.trim());
        for (const sel of sels) {
          expect(sel).toMatch(new RegExp(`^\\.${type === 'button' ? 'btn' : 'card'}(?=$|[\\s.:#[>+~])`));
        }
      }
    }
  });
});

describe('heading/paragraph selector rewriting', () => {
  it('rewrites hN to .heading.hN and collapses duplicates', () => {
    const css = 'h1, .heading.h1 { font-size: 4rem; }\nh2, .heading.h2 { font-size: 3rem; }';
    const out = derive(css, 'heading');
    expect(out).toContain('.heading.h1 { font-size: 4rem; }');
    expect(out).toContain('.heading.h2 { font-size: 3rem; }');
    expect(out).not.toMatch(/(^|, )h[1-6](?=,| \{)/); // no bare element selectors leak
  });

  it('a shared heading rule covers every level class plus .heading', () => {
    const css = 'h1, h2, h3, h4, h5, h6, .heading { font-family: Georgia, serif; }';
    const out = derive(css, 'heading');
    expect(out).toContain('.heading.h1');
    expect(out).toContain('.heading.h6');
    expect(out).toContain('.heading {');
  });

  it('rewrites p to .paragraph', () => {
    expect(derive('p, .paragraph { color: #333; }', 'paragraph')).toBe('.paragraph { color: #333; }');
  });

  it('mixed rules are excluded: heading+button, paragraph+card', () => {
    expect(derive('h1, .btn { color: red; }', 'heading')).toBe('');
    expect(derive('p, .card { color: red; }', 'paragraph')).toBe('');
    expect(derive('h1, p { color: red; }', 'heading')).toBe('');
    expect(derive('h1, p { color: red; }', 'paragraph')).toBe('');
  });

  it('descendant and unrelated selectors never qualify', () => {
    const css = '.hero h1 { color: red; }\n.card-title { color: blue; }\n.footer p { color: gray; }';
    expect(derive(css, 'heading')).toBe('');
    expect(derive(css, 'paragraph')).toBe('');
  });

  it('per-variant: derived heading/paragraph output uses ONLY the component classes', () => {
    for (const name of Object.keys(CSSRenderer.VARIANTS)) {
      const h = r.getTypeCss(name, 'heading');
      for (const line of h.split('\n').filter(Boolean)) {
        for (const sel of line.split('{')[0].split(',').map(s => s.trim())) {
          expect(sel).toMatch(/^\.heading(\.h[1-6])?$/);
        }
      }
      const p = r.getTypeCss(name, 'paragraph');
      for (const line of p.split('\n').filter(Boolean)) {
        expect(line.split('{')[0].trim()).toBe('.paragraph');
      }
    }
  });

  it('markup contract: both render paths emit the same heading/paragraph classes', () => {
    const Component = require('../domain/models/Component.js');
    const HTMLRenderer = require('../application/rendering/HTMLRenderer.js');
    const renderer = new HTMLRenderer();
    const viaExport = new Component({ id: 'a', type: 'heading', content: 'T', level: 'h3' }).toHTML();
    const viaPreview = renderer.renderComponent({ type: 'heading', content: 'T', level: 'h3' });
    expect(viaExport).toContain('class="heading h3"');
    expect(viaPreview).toContain('class="heading h3"');
    const pExport = new Component({ id: 'b', type: 'paragraph', content: 'X' }).toHTML();
    const pPreview = renderer.renderComponent({ type: 'paragraph', content: 'X' });
    expect(pExport).toContain('class="paragraph"');
    expect(pPreview).toContain('class="paragraph"');
  });
});

describe('per-project design variation', () => {
  it('no seed (or an invalid one) means no variation — legacy output untouched', () => {
    expect(r.getVariationCss(null)).toBe('');
    expect(r.getVariationCss(undefined)).toBe('');
    expect(r.getVariationCss(-1)).toBe('');
    expect(r.getVariationCss('3')).toBe('');
    expect(r.render('', [], [])).not.toContain('Design Variation');
  });

  it('is deterministic: same seed, same CSS', () => {
    expect(r.getVariationCss(42)).toBe(r.getVariationCss(42));
    expect(r.render('', [], [], 42)).toBe(r.render('', [], [], 42));
  });

  it('different seeds produce different identities; 120 combos cycle', () => {
    const blocks = new Set();
    for (let i = 0; i < 120; i++) blocks.add(r.getVariationCss(i));
    // Every one of the 120 accent/font/radius combos is distinct and
    // non-empty except the all-default seed 0.
    expect(blocks.size).toBe(120);
    expect(r.getVariationCss(120)).toBe(r.getVariationCss(0));
  });

  it('variation sits between base and variants, so explicit styles win', () => {
    const css = r.render('', ['luxury'], [], 3);
    const variationAt = css.indexOf('/* Design Variation */');
    const variantAt = css.indexOf('/* Design Variants */');
    expect(variationAt).toBeGreaterThan(-1);
    expect(variantAt).toBeGreaterThan(variationAt);
    // Luxury's own .btn rule comes after the variation's -> it wins.
    expect(css.lastIndexOf('.btn { background-color: #b8860b')).toBeGreaterThan(variationAt);
  });

  it('project model + service: seeds are assigned on create and survive round-trips', () => {
    const Project = require('../domain/models/Project.js');
    const ProjectService = require('../domain/services/ProjectService.js');
    const saved = [];
    const stubRepo = {
      findById: () => null,
      create: (p) => { saved.push(p); return { success: true, project: p }; },
    };
    const svc = new ProjectService(stubRepo);
    const res = svc.create('Seed Test Bakery');
    expect(res.success).toBe(true);
    expect(Number.isInteger(saved[0].designSeed)).toBe(true);
    const roundTripped = Project.fromJSON(JSON.parse(JSON.stringify(saved[0])));
    expect(roundTripped.designSeed).toBe(saved[0].designSeed);
    // Legacy JSON without a seed restores as null (default identity).
    expect(Project.fromJSON({ id: 'x', name: 'X', slug: 'x' }).designSeed).toBe(null);
  });
});
