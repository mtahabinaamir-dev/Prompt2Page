/**
 * Pipeline integration tests — the two critical generation breaks.
 *
 * Defect 1: WebsiteGenerator dropped ComponentPlan.properties (only level/alt
 * were forwarded to componentUseCase.add), so blueprint-generated components
 * rendered with empty properties.
 *
 * Defect 2: the NLP/planning stages extract directives such as
 * constraints.colorScheme = "dark" and carry them through every plan model,
 * but nothing consumed them — a "dark" build prompt produced a default site.
 *
 * These tests exercise the exact repaired boundaries with real collaborators
 * (real Component model, real HTMLRenderer, real IntentRouter handler) and
 * only stub infrastructure (repositories, the website-commands module).
 *
 * Run: npx vitest run
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
import WebsiteGenerator from '../application/ai/WebsiteGenerator.js';
import HTMLRenderer from '../application/rendering/HTMLRenderer.js';
import CSSRenderer from '../application/rendering/CSSRenderer.js';
import IntentRouter from '../application/routing/IntentRouter.js';
import Component from '../domain/models/Component.js';
import ComponentService from '../domain/services/ComponentService.js';
import ExportService from '../domain/services/ExportService.js';
import { renderInlineStyles } from '../application/utils/escapeHtml.js';
import { renderCards, renderTabs } from '../application/utils/widgets.js';

const require = createRequire(import.meta.url);

// ── Defect 1: component properties ─────────────────────────────────────

function capturingUseCases(captured) {
  return {
    projectUseCase: {
      create: () => ({ success: true, data: { project: { id: 'p1', name: 'Test Site' } } }),
      switch: () => ({ success: true }),
    },
    pageUseCase: {
      create: ({ name }) => ({ success: true, page: { id: 'home', name } }),
      switch: () => ({ success: true }),
    },
    componentUseCase: {
      add: (data) => {
        captured.push(data);
        return { success: true };
      },
    },
  };
}

const galleryPlan = {
  projectName: 'Test Site',
  business: 'general',
  pages: [
    {
      name: 'Home',
      isHomepage: true,
      components: [
        { type: 'gallery', content: '', properties: { images: ['a.png', 'b.png'] } },
        { type: 'heading', content: 'Hello', properties: { level: 1 } },
        { type: 'paragraph', content: 'No props here' }, // no properties key at all
      ],
    },
  ],
};

describe('WebsiteGenerator component properties', () => {
  it('forwards the full properties object to componentUseCase.add', () => {
    const captured = [];
    const result = new WebsiteGenerator().generate(galleryPlan, capturingUseCases(captured));
    expect(result.success).toBe(true);
    expect(captured).toHaveLength(3);
    expect(captured[0].properties).toEqual({ images: ['a.png', 'b.png'] });
  });

  it('keeps level/alt forwarding working and defaults missing properties to {}', () => {
    const captured = [];
    new WebsiteGenerator().generate(galleryPlan, capturingUseCases(captured));
    // The renderer reads comp.level (top-level), so it must keep working.
    expect(captured[1].level).toBe(1);
    // Backward compatibility: components without properties still work.
    expect(captured[2].properties).toEqual({});
    expect(captured[2].type).toBe('paragraph');
  });

  it('forwarded properties influence rendered HTML (gallery grid)', () => {
    const captured = [];
    new WebsiteGenerator().generate(galleryPlan, capturingUseCases(captured));
    const renderer = new HTMLRenderer();
    // Plain object, as HTMLRenderer.render() receives from components.json.
    const html = renderer.renderComponent({ ...captured[0], id: 'c1' });
    expect(html).toContain('gallery-grid');
    expect(html).toContain('a.png');
    expect(html).toContain('b.png');
  });

  it('property values are HTML-escaped in rendered output', () => {
    const captured = [];
    const evilPlan = {
      ...galleryPlan,
      pages: [
        {
          name: 'Home',
          isHomepage: true,
          components: [
            { type: 'gallery', content: '', properties: { images: ['<script>alert(1)</script>'] } },
          ],
        },
      ],
    };
    new WebsiteGenerator().generate(evilPlan, capturingUseCases(captured));
    const renderer = new HTMLRenderer();
    const html = renderer.renderComponent({ ...captured[0], id: 'c1' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ── Defect 2: extracted color-scheme reaches page styles ───────────────

const websitePath = require.resolve('../commands/website.js');

function stubWebsiteGenerate(project) {
  require.cache[websitePath] = {
    id: websitePath,
    filename: websitePath,
    loaded: true,
    exports: {
      generate: () => ({ success: true, data: { project } }),
    },
  };
}

function fakeContainer() {
  const updated = []; // { projectId, pageId, styles } captured from PageRepository.update
  const rendered = []; // projectIds captured from HTMLRenderer.render
  return {
    updated,
    rendered,
    get(name) {
      if (name === 'PageRepository') {
        return {
          findByProjectId: () => [
            { id: 'home', name: 'Home' },
            { id: 'about', name: 'About' },
          ],
          findById: (projectId, pageId) => ({ id: pageId, projectId, styles: {} }),
          update: (page) => {
            updated.push({ projectId: page.projectId, pageId: page.id, styles: page.styles });
          },
        };
      }
      if (name === 'HTMLRenderer') {
        return {
          render: (projectId) => {
            rendered.push(projectId);
          },
        };
      }
      if (name === 'ProjectState') {
        return { get: () => null }; // no active project: _context() -> null
      }
      throw new Error(`unexpected container.get(${name})`);
    },
  };
}

describe('build color-scheme directive', () => {
  it('applies the dark theme when the prompt extracts colorScheme=dark', async () => {
    stubWebsiteGenerate({ id: 'p9', name: 'Luna' });
    const container = fakeContainer();
    const router = new IntentRouter(container);
    const analysis = {
      entities: {},
      constraints: { colorScheme: 'dark' },
      normalizedPrompt: 'build a dark portfolio site',
    };
    const res = await router._onBuildWebsite(analysis, 'build a dark portfolio site');

    // Same styles the APPLY_THEME intent uses for "dark".
    expect(container.updated).toHaveLength(2);
    for (const u of container.updated) {
      expect(u.projectId).toBe('p9');
      expect(u.styles).toMatchObject({ backgroundColor: '#1a202c', color: '#f7fafc' });
    }
    // Pages are re-rendered so the generated HTML carries the theme.
    expect(container.rendered).toEqual(['p9']);
    expect(res.reply).toContain('Dark');
  });

  it('leaves default styling untouched when no color-scheme directive is present', async () => {
    stubWebsiteGenerate({ id: 'p9', name: 'Luna' });
    const container = fakeContainer();
    const router = new IntentRouter(container);
    const analysis = {
      entities: {},
      constraints: {},
      normalizedPrompt: 'build a portfolio site',
    };
    const res = await router._onBuildWebsite(analysis, 'build a portfolio site');

    expect(container.updated).toHaveLength(0);
    expect(container.rendered).toHaveLength(0);
    expect(res.reply).not.toContain('theme applied');
  });

  it('ignores an unrecognized color-scheme value safely', async () => {
    stubWebsiteGenerate({ id: 'p9', name: 'Luna' });
    const container = fakeContainer();
    const router = new IntentRouter(container);
    const analysis = {
      entities: {},
      constraints: { colorScheme: 'neon' },
      normalizedPrompt: 'build a neon portfolio site',
    };
    const res = await router._onBuildWebsite(analysis, 'build a neon portfolio site');

    expect(container.updated).toHaveLength(0);
    expect(res.success).toBe(true);
  });
});

describe('theme style rendering', () => {
  it('accepts camelCase theme properties (backgroundColor) as well as kebab-case', () => {
    // IntentRouter.THEMES uses camelCase keys; the allowlist is kebab-case.
    const html = renderInlineStyles({ backgroundColor: '#1a202c', color: '#f7fafc' });
    expect(html).toContain('background-color: #1a202c');
    expect(html).toContain('color: #f7fafc');
  });
});

// ── cards / tabs component types ───────────────────────────────────────

function stubComponentService() {
  const page = { id: 'home', projectId: 'p1', name: 'Home', styles: {} };
  const service = new ComponentService(
    {
      add: (c) => c,
      findByPage: () => [],
    },
    {
      findByProjectId: () => [page],
      findById: () => page,
      update: () => {},
    }
  );
  service.getActiveProject = () => ({ id: 'p1', name: 'Test' });
  return service;
}

describe('cards and tabs component types', () => {
  it('are accepted by the component model and service allowlists', () => {
    for (const type of ['cards', 'tabs']) {
      const model = new Component({ id: 'c1', pageId: 'home', projectId: 'p1', type });
      expect(model.validate().isValid).toBe(true);
    }
    const service = stubComponentService();
    for (const type of ['cards', 'tabs']) {
      const res = service.add({
        pageId: 'home',
        type,
        content: '',
        properties: type === 'tabs' ? { items: ['A', 'B'] } : { source: 'features' },
      });
      expect(res.success).toBe(true);
      expect(res.component.type).toBe(type);
    }
  });

  it('render valid cards HTML with provided items', () => {
    const html = renderCards({
      type: 'cards',
      content: 'Our menu',
      properties: {
        layout: 'grid',
        items: [{ title: 'Pizza', text: 'Wood-fired' }, 'Salad'],
      },
    });
    expect(html).toContain('cards-grid');
    expect(html).toContain('<h3 class="heading">Our menu</h3>');
    expect(html).toContain('<h4 class="card-title">Pizza</h4>');
    expect(html).toContain('<p class="card-text">Wood-fired</p>');
    expect(html).toContain('<h4 class="card-title">Salad</h4>');
  });

  it('render a carousel layout when requested', () => {
    const html = renderCards({ type: 'cards', properties: { layout: 'carousel', source: 'testimonials' } });
    expect(html).toContain('cards-carousel');
    expect(html).not.toContain('cards-grid');
  });

  it('fall back to labeled placeholders when cards have no items', () => {
    // Source name humanizes into the placeholder labels.
    const html = renderCards({ type: 'cards', properties: { source: 'featured-dishes' } });
    expect(html).toContain('cards-grid');
    expect(html).toContain('card-placeholder');
    expect(html).toContain('Featured Dishes 1');
    // Malformed / missing properties never crash and never drop the section.
    for (const props of [{ items: 'garbage' }, {}, null, undefined]) {
      const fallback = renderCards({ type: 'cards', properties: props });
      expect(fallback).toContain('cards-grid');
      expect(fallback).toContain('card-placeholder');
    }
  });

  it('render valid, keyboard-accessible tabs HTML', () => {
    const html = renderTabs({
      type: 'tabs',
      content: 'Menu',
      properties: { items: ['Appetizers', 'Mains', 'Desserts'] },
    });
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('type="radio"');
    expect(html).toContain('<label class="tab-label"');
    expect(html).toContain('>Appetizers</label>');
    expect(html).toContain('>Desserts</label>');
    expect(html).toContain('class="tab-panel"');
    // First tab is pre-selected; each tab has a unique id.
    expect(html).toContain('checked');
    const ids = [...html.matchAll(/id="(tabs-\d+-\d+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(3);
  });

  it('fall back safely when tabs have no usable items', () => {
    for (const props of [{}, { items: [] }, { items: 'nope' }, null]) {
      const html = renderTabs({ type: 'tabs', properties: props });
      expect(html).toContain('No tabs configured yet.');
      expect(html).not.toContain('type="radio"');
    }
  });

  it('escape user-supplied card and tab text', () => {
    const cardsHtml = renderCards({
      type: 'cards',
      properties: { items: [{ title: '<script>alert(1)</script>', text: '<b>bold</b>' }] },
    });
    expect(cardsHtml).not.toContain('<script>');
    expect(cardsHtml).toContain('&lt;script&gt;');
    expect(cardsHtml).toContain('&lt;b&gt;bold&lt;/b&gt;');

    const tabsHtml = renderTabs({
      type: 'tabs',
      properties: { items: ['<img src=x onerror=alert(1)>'] },
    });
    expect(tabsHtml).not.toContain('<img src=x');
    expect(tabsHtml).toContain('&lt;img');
  });

  it('reach the renderer through HTMLRenderer.renderComponent (both outputs agree)', () => {
    const renderer = new HTMLRenderer();
    const cardsHtml = renderer.renderComponent({
      type: 'cards',
      properties: { source: 'team-members' },
    });
    expect(cardsHtml).toContain('cards-grid');
    expect(cardsHtml).toContain('Team Members 1');

    const tabsHtml = renderer.renderComponent({
      type: 'tabs',
      properties: { items: ['One', 'Two'] },
    });
    expect(tabsHtml).toContain('role="radiogroup"');

    // Component.toHTML (used for cached page.html in exports) agrees.
    const modelCards = new Component({ id: 'c1', type: 'cards', properties: { source: 'x' } });
    expect(modelCards.toHTML()).toContain('cards-grid');
    const modelTabs = new Component({ id: 'c2', type: 'tabs', properties: { items: ['A'] } });
    expect(modelTabs.toHTML()).toContain('role="radiogroup"');
  });

  it('ship responsive CSS for cards and tabs', () => {
    const css = new CSSRenderer().render();
    expect(css).toContain('.cards-grid');
    expect(css).toContain('.cards-carousel');
    expect(css).toContain('.tab-panel');
    expect(css).toContain('.tab-input:checked + .tab-label + .tab-panel');
    // Responsive: single column cards on narrow screens.
    expect(css).toMatch(/@media\s*\(max-width:\s*768px\)[\s\S]*\.cards-grid\s*\{\s*grid-template-columns:\s*1fr/);
  });
});

// ── preview / export rendering parity ──────────────────────────────────
// Component.toHTML() builds the cached page.html consumed by exports;
// HTMLRenderer.renderComponent() builds the live preview. Both must agree
// for every supported component type.

const PARITY_CASES = [
  { type: 'form', properties: { fields: ['name', 'email', 'date'] } },
  { type: 'gallery', properties: { images: ['a.png', 'b.png'] } },
  { type: 'gallery', properties: {} },
  { type: 'table', content: 'Hours', properties: { rows: ['Mon|9-5', 'Tue|9-5'] } },
  { type: 'map', content: 'Downtown' },
  { type: 'icons', properties: { platforms: ['instagram', 'twitter'] } },
  { type: 'cards', properties: { source: 'team-members', layout: 'grid' } },
  { type: 'cards', properties: { layout: 'carousel', items: [{ title: 'T', text: 'x' }] } },
  { type: 'tabs', properties: { items: ['One', 'Two'] } },
];

function normalizeParity(html) {
  // Tab radio-group ids are intentionally unique per render; normalize them.
  return html.replace(/tabs-\d+/g, 'tabs-N');
}

describe('preview / export rendering parity', () => {
  const renderer = new HTMLRenderer();

  it.each(PARITY_CASES)('toHTML() and renderComponent() agree for $type', (c) => {
    const model = new Component({ id: 'c1', pageId: 'p', projectId: 'pr', ...c });
    const viaModel = model.toHTML();
    const viaRenderer = renderer.renderComponent({ ...c });
    expect(viaModel).not.toContain('unknown component');
    expect(viaRenderer).not.toContain('unknown component');
    expect(normalizeParity(viaModel)).toBe(normalizeParity(viaRenderer));
  });

  it('handles malformed properties without crashing in both paths', () => {
    const bad = [
      { type: 'form', properties: { fields: 'nope' } },
      { type: 'gallery', properties: { images: null } },
      { type: 'table', properties: { rows: [null, 42] } },
      { type: 'map', properties: null },
      { type: 'icons', properties: { platforms: 'x' } },
      { type: 'cards', properties: null },
      { type: 'tabs', properties: { items: [null, '  '] } },
    ];
    for (const c of bad) {
      const model = new Component({ id: 'c1', pageId: 'p', projectId: 'pr', ...c });
      expect(() => model.toHTML()).not.toThrow();
      expect(() => renderer.renderComponent({ ...c })).not.toThrow();
      expect(model.toHTML()).not.toContain('unknown component');
    }
  });

  it('escapes injection attempts identically in both paths', () => {
    const evil = { type: 'form', properties: { fields: ['<script>alert(1)</script>'] } };
    const model = new Component({ id: 'c1', pageId: 'p', projectId: 'pr', ...evil });
    for (const html of [model.toHTML(), renderer.renderComponent({ ...evil })]) {
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    }
    const evilTable = { type: 'table', properties: { rows: ['a|<img src=x onerror=alert(1)>'] } };
    const tableModel = new Component({ id: 'c2', pageId: 'p', projectId: 'pr', ...evilTable });
    expect(tableModel.toHTML()).not.toContain('<img src=x');
    expect(tableModel.toHTML()).toContain('&lt;img');
  });

  it('keeps truly unknown types safe in both paths', () => {
    const model = new Component({ id: 'c1', pageId: 'p', projectId: 'pr', type: 'wat' });
    // Model validation rejects it; the model degrades to an HTML comment…
    expect(model.validate().isValid).toBe(false);
    expect(model.toHTML()).toContain('unknown component');
    // …while the renderer degrades to a safe generic div (content escaped).
    const html = renderer.renderComponent({ type: 'wat', content: '<b>x</b>' });
    expect(html).toContain('component-wat');
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;b&gt;');
  });
});

describe('export includes component CSS', () => {
  const fs = require('fs');
  const path = require('path');
  const exportDir = path.join(process.cwd(), 'exports', 'export-test');

  function stubExportService() {
    const service = new ExportService(
      { create: () => {} },
      {
        findByProjectId: () => [
          {
            id: 'home',
            isHomepage: true,
            html: '<!DOCTYPE html>\n<html>\n<head><title>T</title></head>\n<body><p>hi</p></body>\n</html>',
          },
        ],
      },
      { findByProjectId: () => [] },
      null
    );
    service.getActiveProject = () => ({ id: 'export-test', name: 'Export Test' });
    return service;
  }

  it('writes styles.css and links it from exported pages', () => {
    const res = stubExportService().exportHTML();
    expect(res.success).toBe(true);
    const indexHtml = fs.readFileSync(path.join(exportDir, 'html', 'index.html'), 'utf8');
    expect(indexHtml).toContain('<link rel="stylesheet" href="styles.css">');
    const css = fs.readFileSync(path.join(exportDir, 'html', 'styles.css'), 'utf8');
    for (const cls of ['.cards-grid', '.tab-panel', '.site-form', '.gallery-grid', '.site-table', '.map-embed', '.social-icons']) {
      expect(css).toContain(cls);
    }
    // Cleanup: the export folder is a real side effect of the test.
    fs.rmSync(path.join(process.cwd(), 'exports', 'export-test'), { recursive: true, force: true });
  });

  it('injects SEO metadata matching the page into exported pages', () => {
    const service = stubExportService();
    // Give the stubbed page SEO fields like a real built page.
    service.pageRepository.findByProjectId = () => [
      {
        id: 'home',
        name: 'Home',
        isHomepage: true,
        seoTitle: 'Best Bakery in Town',
        seoDescription: 'Fresh bread daily.',
        html: '<!DOCTYPE html>\n<html>\n<head><title>Home</title></head>\n<body><p>hi</p></body>\n</html>',
      },
    ];
    const res = service.exportHTML();
    expect(res.success).toBe(true);
    const indexHtml = fs.readFileSync(path.join(exportDir, 'html', 'index.html'), 'utf8');
    expect(indexHtml).toContain('<title>Best Bakery in Town</title>');
    expect(indexHtml).toContain('<meta name="description" content="Fresh bread daily.">');
    expect(indexHtml).toContain('<meta property="og:title" content="Best Bakery in Town">');
    expect(indexHtml).toContain('<meta property="og:description" content="Fresh bread daily.">');
    expect(indexHtml).toContain('<link rel="icon" href="data:image/svg+xml,');
    // Injection attempts in SEO fields must be escaped.
    fs.rmSync(path.join(process.cwd(), 'exports', 'export-test'), { recursive: true, force: true });
  });

  it('escapes SEO field injection in exported pages', () => {
    const service = stubExportService();
    service.pageRepository.findByProjectId = () => [
      {
        id: 'home',
        name: 'Home',
        isHomepage: true,
        seoTitle: '<script>alert(1)</script>',
        seoDescription: 'x" onerror="y',
        html: '<!DOCTYPE html>\n<html>\n<head><title>Home</title></head>\n<body><p>hi</p></body>\n</html>',
      },
    ];
    expect(service.exportHTML().success).toBe(true);
    const indexHtml = fs.readFileSync(path.join(exportDir, 'html', 'index.html'), 'utf8');
    expect(indexHtml).not.toContain('<script>alert(1)</script>');
    expect(indexHtml).toContain('&lt;script&gt;');
    expect(indexHtml).not.toContain('content="x" onerror=');
    fs.rmSync(path.join(process.cwd(), 'exports', 'export-test'), { recursive: true, force: true });
  });
});

describe('add-page switches to the new page', () => {
  function pageContainer() {
    const pages = [{ id: 'home', name: 'Home', projectId: 'p1' }];
    let activePage = pages[0];
    return {
      get activePage() { return activePage; },
      get(name) {
        if (name === 'PageState') return { get: () => activePage, set: (p) => { activePage = p; } };
        if (name === 'ProjectState') return { get: () => ({ id: 'p1', name: 'Test' }) };
        if (name === 'PageUseCase') {
          return {
            create: ({ name: n }) => {
              const p = { id: 'catering', name: n, projectId: 'p1' };
              pages.push(p);
              return { success: true, page: p };
            },
          };
        }
        if (name === 'PageRepository') return { findByProjectId: () => pages };
        if (name === 'ComponentRepository') return { findByPage: () => [] };
        if (name === 'HTMLRenderer') return { render: () => {} };
        throw new Error(`unexpected container.get(${name})`);
      },
    };
  }

  it('sets PageState to the created page', async () => {
    const container = pageContainer();
    const router = new IntentRouter(container);
    const res = await router._onAddPage({ normalizedPrompt: 'add a catering page' });
    expect(res.success).toBe(true);
    expect(container.activePage.name).toBe('Catering');
    expect(res.reply).toContain('switched to it');
  });
});

describe('switch-page name extraction', () => {
  function switchContainer() {
    const pages = [
      { id: 'home', name: 'Home', projectId: 'p1' },
      { id: 'about', name: 'About', projectId: 'p1' },
    ];
    let activePage = pages[0];
    return {
      get activePage() { return activePage; },
      get(name) {
        if (name === 'PageState') return { get: () => activePage, set: (p) => { activePage = p; } };
        if (name === 'ProjectState') return { get: () => ({ id: 'p1', name: 'Test' }) };
        if (name === 'PageRepository') return { findByProjectId: () => pages, findById: (pid, id) => pages.find((p) => p.id === id) || null };
        if (name === 'ComponentRepository') return { findByPage: () => [] };
        if (name === 'HTMLRenderer') return { render: () => {} };
        throw new Error(`unexpected container.get(${name})`);
      },
    };
  }

  it.each([
    ['switch to the about page', 'About'],
    ['switch to about page', 'About'],
    ['switch page about', 'About'],
    ['go to the about page', 'About'],
  ])('"%s" switches to %s', async (cmd, expected) => {
    const container = switchContainer();
    const router = new IntentRouter(container);
    const res = await router._onSwitchPage({}, cmd);
    expect(res.success).toBe(true);
    expect(container.activePage.name).toBe(expected);
  });
});

describe('switch-project name lookup', () => {
  function projectContainer() {
    const projects = [
      { id: 'bakery-project', name: 'Bakery Project' },
      { id: 'golden-crust', name: 'Golden Crust' },
    ];
    let active = projects[1];
    return {
      get active() { return active; },
      get(name) {
        if (name === 'ProjectState') return { get: () => active, set: (p) => { active = p; } };
        if (name === 'PageState') return { get: () => null, set: () => {}, getLastActive: () => null };
        if (name === 'ProjectRepository') return { findAll: () => projects, findById: (id) => projects.find((p) => p.id === id) || null };
        if (name === 'PageRepository') return { findByProjectId: () => [] };
        if (name === 'ComponentRepository') return { findByPage: () => [] };
        if (name === 'HTMLRenderer') return { render: () => {} };
        throw new Error(`unexpected container.get(${name})`);
      },
    };
  }

  it.each([
    ['switch to Bakery Project', 'Bakery Project'],
    ['open Bakery Project', 'Bakery Project'],
    ['switch to the Bakery Project site', 'Bakery Project'],
    ['switch to Golden Crust', 'Golden Crust'],
  ])('"%s" activates %s', async (cmd, expected) => {
    const container = projectContainer();
    const router = new IntentRouter(container);
    // _activateProject may touch more container keys; stub via the real path
    // is heavy, so exercise extraction + lookup, the units that were broken.
    const extracted = router._extractProjectName(cmd);
    const target = router._findProjectByName(extracted);
    expect(target && target.name).toBe(expected);
  });
});

describe('spell corrector preserves valid words', () => {
  const SpellCorrector = require('../application/nlp/stages/SpellCorrector.js');
  const corrector = new SpellCorrector();

  function correct(input) {
    // The corrector runs on the normalizer's lowercase output.
    const pa = { normalizedPrompt: String(input).toLowerCase() };
    corrector.process(pa);
    return pa.normalizedPrompt;
  }

  it.each([
    ['add a test page', 'add a test page'],
    ['add a tent page', 'add a tent page'],
    ['add a tests page', 'add a tests page'],
    ['build a website for test kitchen', 'build a website for test kitchen'],
    ['add a menu page', 'add a menu page'],
    ['add an about page', 'add an about page'],
    ['add a contact page', 'add a contact page'],
    ['add a specials page', 'add a specials page'],
    ['add a "teest" page', 'add a "teest" page'],
    ["add a 'branding' page", "add a 'branding' page"],
  ])('preserves %s', (input, expected) => {
    expect(correct(input)).toBe(expected);
  });

  it.each([
    ['build a resturant website', 'build a restaurant website'],
    ['build a webiste for acme', 'build a website for acme'],
    ['add a buton saying click', 'add a button saying click'],
    ['change the backgroud to blue', 'change the background to blue'],
  ])('still corrects genuine typos: %s', (input, expected) => {
    expect(correct(input)).toBe(expected);
  });

  it('creates a page named "Test" end to end', async () => {
    const pages = [{ id: 'home', name: 'Home', projectId: 'p1' }];
    let activePage = pages[0];
    const container = {
      get(name) {
        if (name === 'PageState') return { get: () => activePage, set: (p) => { activePage = p; } };
        if (name === 'ProjectState') return { get: () => ({ id: 'p1', name: 'Test' }) };
        if (name === 'PageUseCase') {
          return {
            create: ({ name: n }) => {
              const p = { id: 'test', name: n, projectId: 'p1' };
              pages.push(p);
              return { success: true, page: p };
            },
          };
        }
        if (name === 'PageRepository') return { findByProjectId: () => pages };
        if (name === 'ComponentRepository') return { findByPage: () => [] };
        if (name === 'HTMLRenderer') return { render: () => {} };
        throw new Error(`unexpected container.get(${name})`);
      },
    };
    const router = new IntentRouter(container);
    // Simulate the real pipeline: normalize, then spell-correct, then extract.
    const raw = 'add a test page';
    const normalized = raw.toLowerCase();
    const pa = { normalizedPrompt: normalized };
    corrector.process(pa);
    const res = await router._onAddPage({ normalizedPrompt: pa.normalizedPrompt });
    expect(res.success).toBe(true);
    expect(pages[pages.length - 1].name).toBe('Test');
  });
});

describe('creative-prompt fidelity', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const CSSRenderer = require('../application/rendering/CSSRenderer.js');

  function analyzeStyles(prompt) {
    const a = new NLPEngine().analyze(prompt);
    return { styles: a.styles, themes: a.themes, constraints: a.constraints };
  }

  it('extracts distinct directions from contrasting prompts', () => {
    const luxury = analyzeStyles('Create a luxury, cinematic restaurant website with oversized typography.');
    expect(luxury.styles).toEqual(expect.arrayContaining(['luxury', 'oversized']));
    expect(luxury.themes).toEqual(expect.arrayContaining(['cinematic']));

    const playful = analyzeStyles('Create a playful, colorful restaurant website with hand-drawn accents.');
    expect(playful.styles).toEqual(expect.arrayContaining(['playful', 'colorful']));
    expect(playful.themes).toEqual([]);

    const minimal = analyzeStyles('Create a minimalist restaurant website inspired by an art gallery.');
    expect(minimal.styles).toEqual(expect.arrayContaining(['minimalist']));
    expect(minimal.themes).toEqual(expect.arrayContaining(['museum']));

    const rustic = analyzeStyles('Create a rustic bakery website with warm colors and a vintage feel.');
    expect(rustic.styles).toEqual(expect.arrayContaining(['rustic', 'warm']));
    expect(rustic.themes).toEqual(expect.arrayContaining(['retro']));
  });

  it('does not extract styles from substrings of other words', () => {
    // "drawn" contains "raw" (brutalist); "accents" contains "en" (english).
    const r = analyzeStyles('Create a playful restaurant website with hand-drawn accents.');
    expect(r.styles).not.toContain('brutalist');
    expect(r.constraints.languages).toBeUndefined();
    // …but the real standalone words still match.
    expect(analyzeStyles('make it in english').constraints.languages).toEqual(['english']);
    expect(analyzeStyles('add raw fish to the menu').styles).toContain('brutalist');
  });

  it('corrects typos in style words', () => {
    expect(analyzeStyles('Create a luxary website').styles).toContain('luxury');
    expect(analyzeStyles('Create a playfull website').styles).toContain('playful');
    expect(analyzeStyles('Create a minimalistic website').styles).toContain('minimalist');
  });

  it('renders visibly different CSS per creative direction', () => {
    const css = new CSSRenderer();
    const base = css.render();
    const luxury = css.render('', ['luxury', 'cinematic', 'oversized']);
    const playful = css.render('', ['playful', 'colorful']);
    const minimal = css.render('', ['minimalist', 'museum']);
    const rustic = css.render('', ['rustic', 'warm', 'retro']);

    for (const [name, sheet] of [['luxury', luxury], ['playful', playful], ['minimal', minimal], ['rustic', rustic]]) {
      expect(sheet.length).toBeGreaterThan(base.length);
      expect(sheet).toContain('Design variant:');
      expect(sheet).not.toBe(base);
    }
    // Each direction is distinct from the others.
    const sheets = new Set([luxury, playful, minimal, rustic]);
    expect(sheets.size).toBe(4);
    // Spot-check observable differences.
    expect(luxury).toContain('#b8860b'); // gold accent
    expect(playful).toContain('999px'); // pill buttons
    expect(minimal).toContain('#ffffff'); // stark white
    expect(rustic).toContain('#a0522d'); // earthy brown
  });

  it('keeps variant rendering backward compatible', () => {
    const css = new CSSRenderer();
    const base = css.render();
    expect(css.render('', [])).toBe(base);
    expect(css.render('', ['not-a-real-variant'])).toBe(base);
    expect(css.render('', null)).toBe(base);
    // Duplicates collapse; custom styles still append after variants.
    const dup = css.render('', ['luxury', 'luxury']);
    expect(dup).toBe(css.render('', ['luxury']));
    expect(css.render('h1{color:red}', ['luxury'])).toContain('Custom Styles');
  });
});

describe('structural and content variation by creative direction', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const WebsitePlanner = require('../application/planning/WebsitePlanner.js');
  const BlueprintResolver = require('../application/planning/BlueprintResolver.js');
  const ComponentPlanner = require('../application/planning/ComponentPlanner.js');

  function planComponents(prompt) {
    const analysis = new NLPEngine().analyze(prompt);
    const websitePlan = new WebsitePlanner().plan(analysis);
    const resolved = new BlueprintResolver().resolve(websitePlan);
    const componentPlan = new ComponentPlanner().plan(resolved);
    return componentPlan;
  }

  function homeComponents(plan) {
    const home = plan.pages.find((p) => p.name === 'Home');
    return home ? home.components : [];
  }

  it('gives luxury and playful restaurants different content tone', () => {
    const luxury = homeComponents(planComponents('Create a luxury restaurant website for Maison Noir'));
    const playful = homeComponents(planComponents('Create a playful restaurant website for Sunny Side'));

    const luxuryPara = luxury.find((c) => c.type === 'paragraph').content;
    const playfulPara = playful.find((c) => c.type === 'paragraph').content;
    expect(luxuryPara).not.toBe(playfulPara);
    expect(luxuryPara).toContain('fine-dining');
    expect(playfulPara).toContain('Come hungry');

    const luxuryCta = luxury.filter((c) => c.type === 'heading').map((c) => c.content);
    const playfulCta = playful.filter((c) => c.type === 'heading').map((c) => c.content);
    expect(luxuryCta).toContain('Reserve Your Evening');
    expect(playfulCta).toContain("Hungry? Let's Fix That.");
  });

  it('drives cards layout from style direction', () => {
    const luxury = homeComponents(planComponents('Create a luxury restaurant website for Maison Noir'));
    const playful = homeComponents(planComponents('Create a playful restaurant website for Sunny Side'));
    const plain = homeComponents(planComponents('Create a restaurant website for Plain Diner'));

    const layouts = (comps) => comps.filter((c) => c.type === 'cards').map((c) => c.properties.layout);
    expect(layouts(luxury)).toEqual(['grid', 'grid']);
    expect(layouts(playful)).toEqual(['carousel', 'carousel']);
    // No direction: blueprint defaults preserved.
    expect(layouts(plain)).toEqual(['grid', 'carousel']);
  });

  it('drops the non-essential Testimonials section for minimalist', () => {
    const minimal = homeComponents(planComponents('Create a minimalist restaurant website for White Cube'));
    const plain = homeComponents(planComponents('Create a restaurant website for Plain Diner'));
    const hasTestimonials = (comps) => comps.some((c) => c.content === 'What Our Guests Say');
    expect(hasTestimonials(minimal)).toBe(false);
    expect(hasTestimonials(plain)).toBe(true);
    // Essential content is preserved: hero, menu teasers, CTA all remain.
    const headings = minimal.filter((c) => c.type === 'heading').map((c) => c.content);
    expect(headings.length).toBeGreaterThan(0);
    expect(minimal.some((c) => c.type === 'button')).toBe(true);
  });

  it('varies tone for bakery and generic businesses', () => {
    const rustic = homeComponents(planComponents('Create a rustic bakery website for Hearth'));
    const modern = homeComponents(planComponents('Create a modern bakery website for Crumb'));
    const rusticHeadings = rustic.filter((c) => c.type === 'heading').map((c) => c.content);
    expect(rusticHeadings).toContain('Baked Like Grandma Used To');
    expect(rusticHeadings).not.toEqual(
      homeComponents(planComponents('Create a bakery website for Plain Loaf'))
        .filter((c) => c.type === 'heading')
        .map((c) => c.content)
    );
    // Modern has no bakery tone override: falls back to default content.
    expect(modern.some((c) => c.content === 'Baked Fresh Every Morning')).toBe(true);

    const playfulPortfolio = homeComponents(planComponents('Create a playful portfolio website for Sam'));
    expect(playfulPortfolio.find((c) => c.type === 'paragraph').content).toContain('zero fuss');
  });

  it('keeps tone selection deterministic and safe', () => {
    const a = planComponents('Create a luxury playful restaurant website for Mix');
    const b = planComponents('Create a luxury playful restaurant website for Mix');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    // Unknown styles never break planning.
    const weird = planComponents('Create a zzzqxy restaurant website for Weird');
    expect(weird.pages.length).toBeGreaterThan(0);
    expect(homeComponents(weird).length).toBeGreaterThan(0);
  });
});

describe('post-build restyling', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const CSSRenderer = require('../application/rendering/CSSRenderer.js');

  function restyleContainer(initialVariants = []) {
    let stored = { id: 'p1', name: 'Test', designVariants: [...initialVariants] };
    let rendered = null;
    const container = {
      get(name) {
        if (name === 'ProjectState') {
          return {
            get: () => stored,
            set: (p) => { stored = p; },
          };
        }
        if (name === 'PageState') {
          return { get: () => ({ id: 'home', name: 'Home', projectId: 'p1' }), set: () => {}, getLastActive: () => null };
        }
        if (name === 'ProjectRepository') {
          return { findById: () => stored, update: (p) => { stored = p; } };
        }
        if (name === 'PageRepository') {
          return { findByProjectId: () => [{ id: 'home', name: 'Home' }], findById: () => ({ id: 'home', name: 'Home' }) };
        }
        if (name === 'ComponentRepository') return { findByPage: () => [] };
        if (name === 'HTMLRenderer') return { render: (id) => { rendered = id; } };
        throw new Error(`unexpected container.get(${name})`);
      },
    };
    return { container, get stored() { return stored; }, get rendered() { return rendered; } };
  }

  async function runRestyle(cmd, initialVariants = []) {
    const t = restyleContainer(initialVariants);
    const router = new IntentRouter(t.container);
    const analysis = new NLPEngine().analyze(cmd);
    const res = await router._onRestyle(analysis, cmd);
    return { res, variants: t.stored.designVariants, rendered: t.rendered };
  }

  it.each([
    ['Make it more playful.', 'RESTYLE'],
    ['Switch to a luxury style.', 'RESTYLE'],
    ['Make the design minimalist.', 'RESTYLE'],
    ['Use warm, rustic colors.', 'RESTYLE'],
    ['Make it professional but keep the existing layout.', 'RESTYLE'],
  ])('classifies %s as RESTYLE', (cmd, expected) => {
    expect(new NLPEngine().analyze(cmd).intent).toBe(expected);
  });

  it('does not steal neighboring intents', () => {
    const cases = [
      ['apply the dark theme', 'APPLY_THEME'],
      ['apply the warm theme', 'APPLY_THEME'],
      ['make the background dark', 'EDIT_STYLE'],
      ['change the headline to Fresh Bread', 'EDIT_TEXT'],
      ['switch to Bakery Project', 'SWITCH_PROJECT'],
      ['build a luxury restaurant website', 'BUILD_WEBSITE'],
      ['add a test page', 'ADD_PAGE'],
      ['switch page about', 'SWITCH_PAGE'],
    ];
    for (const [cmd, expected] of cases) {
      expect(new NLPEngine().analyze(cmd).intent).toBe(expected);
    }
  });

  it('adds to existing variants on additive language', async () => {
    const { res, variants, rendered } = await runRestyle('make it more playful', ['luxury']);
    expect(res.success).toBe(true);
    expect(variants).toEqual(['luxury', 'playful']);
    expect(rendered).toBe('p1');
  });

  it('replaces variants on switching language', async () => {
    const { variants } = await runRestyle('switch to a minimalist style', ['luxury', 'playful']);
    expect(variants).toEqual(['minimalist']);
  });

  it('replaces by default when declaring the design', async () => {
    const { variants } = await runRestyle('make the design minimalist', ['luxury']);
    expect(variants).toEqual(['minimalist']);
  });

  it('combines compatible directions', async () => {
    const { variants } = await runRestyle('use warm, rustic colors', []);
    expect(variants).toEqual(expect.arrayContaining(['warm', 'rustic']));
  });

  it('keeps existing variants on "keep" language', async () => {
    const { variants } = await runRestyle('make it professional but keep the existing layout', ['playful']);
    expect(variants).toEqual(['playful', 'professional']);
  });

  it('resolves "switch from X to Y" to the target only', async () => {
    const { variants } = await runRestyle('switch from luxury to playful', ['luxury']);
    expect(variants).toEqual(['playful']);
  });

  it('changes the rendered CSS for the new variants', async () => {
    const css = new CSSRenderer();
    const before = css.render('', ['luxury']);
    const { variants } = await runRestyle('make it more playful', ['luxury']);
    const after = css.render('', variants);
    expect(after).not.toBe(before);
    expect(after).toContain('Design variant: playful');
  });

  it('asks for a known style when none extracted', async () => {
    const t = restyleContainer(['luxury']);
    const router = new IntentRouter(t.container);
    // Bypass classification: call handler with no style directions.
    const res = await router._onRestyle({ styles: [], themes: [], normalizedPrompt: 'restyle it' }, 'restyle it');
    expect(res.reply).toContain('I can restyle with:');
    expect(res.refreshPreview).toBe(false);
    expect(t.stored.designVariants).toEqual(['luxury']);
  });
});

describe('page-count constraint', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const WebsitePlanner = require('../application/planning/WebsitePlanner.js');
  const BlueprintResolver = require('../application/planning/BlueprintResolver.js');
  const ComponentPlanner = require('../application/planning/ComponentPlanner.js');

  function planPages(prompt) {
    const analysis = new NLPEngine().analyze(prompt);
    const websitePlan = new WebsitePlanner().plan(analysis);
    const resolved = new BlueprintResolver().resolve(websitePlan);
    const componentPlan = new ComponentPlanner().plan(resolved);
    return { analysis, websitePlan, componentPlan };
  }

  it.each([
    ['Create a one-page restaurant website for Solo', 1],
    ['Create a three-page bakery website for Trio', 3],
    ['Create exactly five pages restaurant website for Five', 5],
    ['Build a site with 4 pages for Four', 4],
    ['a single page portfolio for One', 1],
  ])('extracts pageCount from %s', (cmd, expected) => {
    expect(new NLPEngine().analyze(cmd).constraints.pageCount).toBe(expected);
  });

  it('builds a one-page site with all sections merged', () => {
    const { websitePlan, componentPlan } = planPages('Create a one-page restaurant website for Solo');
    expect(websitePlan.pages).toEqual(['Home']);
    const home = componentPlan.pages.find((p) => p.name === 'Home');
    // All 16 restaurant sections merged; menu, hours, contact content present.
    expect(home.components.length).toBeGreaterThan(30);
    const texts = home.components.map((c) => c.content || c.label || '').join(' ');
    expect(texts).toContain('Our Menu');
    expect(texts).toContain('Book your table');
  });

  it('trims to essentials for a three-page bakery', () => {
    const { websitePlan, componentPlan } = planPages('Create a three-page bakery website for Trio');
    expect(websitePlan.pages).toEqual(['Home', 'Products', 'Contact']);
    // Essential business content preserved on each page.
    for (const page of componentPlan.pages) {
      expect(page.components.length).toBeGreaterThan(0);
    }
    const contact = componentPlan.pages.find((p) => p.name === 'Contact');
    const contactText = contact.components.map((c) => c.content || c.label || '').join(' ');
    expect(contactText).toContain('Get In Touch');
  });

  it('preserves blueprint defaults when no count is given', () => {
    const { websitePlan } = planPages('Create a restaurant website for Full');
    expect(websitePlan.pages).toEqual(['Home', 'Menu', 'About', 'Reservations', 'Contact']);
    const { websitePlan: wp2 } = planPages('Create a bakery website for Plain');
    expect(wp2.pages).toEqual(['Home', 'Products', 'About', 'Contact']);
  });

  it('caps at the blueprint page count without empty pages', () => {
    const { websitePlan, componentPlan } = planPages('Create a ten-page bakery website for Big');
    expect(websitePlan.pages).toEqual(['Home', 'Products', 'About', 'Contact']);
    for (const page of componentPlan.pages) {
      expect(page.components.length).toBeGreaterThan(0);
    }
  });

  it('keeps two most essential pages for a two-page request', () => {
    const { websitePlan } = planPages('Create a two-page restaurant website for Duo');
    expect(websitePlan.pages).toEqual(['Home', 'Menu']);
  });

  it('is deterministic', () => {
    const a = planPages('Create a three-page bakery website for Trio');
    const b = planPages('Create a three-page bakery website for Trio');
    expect(JSON.stringify(a.websitePlan.pages)).toBe(JSON.stringify(b.websitePlan.pages));
  });
});

describe('page-count build classification', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');

  it.each([
    'Create a one-page restaurant website for Solo',
    'Create a three-page bakery website for Trio',
    'Build a two-page portfolio site for Duo',
    'I need a five-page saas website',
  ])('classifies %s as BUILD_WEBSITE', (cmd) => {
    expect(new NLPEngine().analyze(cmd).intent).toBe('BUILD_WEBSITE');
  });

  it('keeps genuine page commands away from BUILD_WEBSITE', () => {
    expect(new NLPEngine().analyze('create an about page for the site').intent).toBe('ADD_PAGE');
    expect(new NLPEngine().analyze('add a test page').intent).toBe('ADD_PAGE');
  });
});

describe('routing regression pairs', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');

  it.each([
    ['Create a three-page website', 'BUILD_WEBSITE'],
    ['Add three pages to my existing site.', 'ADD_PAGE'],
    ['Build a new restaurant website', 'BUILD_WEBSITE'],
    ['Switch to my restaurant project.', 'SWITCH_PROJECT'],
    ['Make it more playful', 'RESTYLE'],
    ['Edit the heading text to say playful.', 'EDIT_TEXT'],
    ['Use a dark theme', 'APPLY_THEME'],
    ['Set the background color to dark blue.', 'EDIT_STYLE'],
    ['Create a test page', 'ADD_PAGE'],
    ['Create a website for Test Kitchen.', 'BUILD_WEBSITE'],
  ])('%s routes to %s', (cmd, expected) => {
    expect(new NLPEngine().analyze(cmd).intent).toBe(expected);
  });
});

describe('restyle undo/redo', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const CSSRenderer = require('../application/rendering/CSSRenderer.js');

  function undoContainer() {
    const projects = {
      p1: { id: 'p1', name: 'Test', designVariants: ['luxury'] },
    };
    let activeId = 'p1';
    const pages = [{ id: 'home', name: 'Home', projectId: 'p1', styles: {} }];
    let renderedCss = '';
    const container = {
      get(name) {
        if (name === 'ProjectState') {
          return { get: () => projects[activeId], set: (p) => { projects[p.id] = p; } };
        }
        if (name === 'PageState') {
          return { get: () => pages[0], set: () => {}, getLastActive: () => null };
        }
        if (name === 'ProjectRepository') {
          return {
            findById: (id) => (projects[id] ? { ...projects[id] } : null),
            update: (p) => { projects[p.id] = p; },
          };
        }
        if (name === 'PageRepository') {
          return {
            findByProjectId: () => pages,
            findById: (id) => pages.find((p) => p.id === id),
            getHomepage: () => pages[0],
          };
        }
        if (name === 'ComponentRepository') {
          return { findByPage: () => [], saveAll: () => {} };
        }
        if (name === 'HTMLRenderer') {
          return {
            render: (id) => {
              renderedCss = new CSSRenderer().render('', projects[id].designVariants || []);
            },
          };
        }
        throw new Error(`unexpected container.get(${name})`);
      },
    };
    return {
      container,
      variants: () => [...projects[activeId].designVariants],
      css: () => renderedCss,
    };
  }

  async function run(router, cmd) {
    const analysis = new NLPEngine().analyze(cmd);
    const method = { RESTYLE: '_onRestyle', UNDO: '_onUndo', REDO: '_onRedo' }[analysis.intent];
    return router[method](analysis, cmd);
  }

  it('restyle → undo restores previous variants and CSS', async () => {
    const t = undoContainer();
    const router = new IntentRouter(t.container);
    await run(router, 'make it more playful');
    expect(t.variants()).toEqual(['luxury', 'playful']);
    expect(t.css()).toContain('Design variant: playful');
    await run(router, 'undo that');
    expect(t.variants()).toEqual(['luxury']);
    expect(t.css()).not.toContain('Design variant: playful');
    expect(t.css()).toContain('Design variant: luxury');
  });

  it('restyle → undo → redo restores the new design', async () => {
    const t = undoContainer();
    const router = new IntentRouter(t.container);
    await run(router, 'switch to a minimalist style');
    expect(t.variants()).toEqual(['minimalist']);
    await run(router, 'undo that');
    expect(t.variants()).toEqual(['luxury']);
    await run(router, 'redo that');
    expect(t.variants()).toEqual(['minimalist']);
    expect(t.css()).toContain('Design variant: minimalist');
  });

  it('undo of a text edit does not clobber design variants', async () => {
    const t = undoContainer();
    const router = new IntentRouter(t.container);
    // Simulate a restyle followed by an unrelated snapshot/restore cycle.
    await run(router, 'make it more playful');
    await run(router, 'undo that');
    await run(router, 'redo that');
    expect(t.variants()).toEqual(['luxury', 'playful']);
  });
});

describe('creative-prompt fidelity audit', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');

  it.each([
    ['Make the existing site more playful without changing its content.', 'RESTYLE'],
    ['Make this site more playful.', 'RESTYLE'],
    ['Make my site playful.', 'RESTYLE'],
    ['Restyle the site to be more modern.', 'RESTYLE'],
  ])('%s routes to RESTYLE', (cmd, expected) => {
    expect(new NLPEngine().analyze(cmd).intent).toBe(expected);
  });

  it('keeps genuine build/switch commands away from RESTYLE', () => {
    expect(new NLPEngine().analyze('Build a new restaurant website').intent).toBe('BUILD_WEBSITE');
    expect(new NLPEngine().analyze('Switch to my restaurant project.').intent).toBe('SWITCH_PROJECT');
    expect(new NLPEngine().analyze('build a site').intent).toBe('BUILD_WEBSITE');
  });

  it('keeps multiple style adjectives without erasure', () => {
    const a = new NLPEngine().analyze('Create a warm, rustic, three-page bakery website.');
    expect(a.styles).toEqual(expect.arrayContaining(['warm', 'rustic']));
    expect(a.constraints.pageCount).toBe(3);
    const b = new NLPEngine().analyze('Create a luxury portfolio with oversized typography and colorful accents.');
    expect(b.styles).toEqual(expect.arrayContaining(['luxury', 'oversized', 'colorful']));
    expect(b.themes).toEqual([]);
  });

  it('keeps theme instructions distinct from style variants', () => {
    const a = new NLPEngine().analyze('Build a minimalist restaurant website with a dark theme.');
    expect(a.intent).toBe('BUILD_WEBSITE');
    expect(a.styles).toContain('minimalist');
    expect(a.constraints.colorScheme).toBe('dark');
  });
});

describe('scoped restyling (type:button vertical slice)', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const CSSRenderer = require('../application/rendering/CSSRenderer.js');

  function scopedContainer() {
    const projects = { p1: { id: 'p1', name: 'Test', designVariants: [], styleScopes: [] } };
    let rendered = '';
    const container = {
      get(name) {
        if (name === 'ProjectState') {
          return { get: () => projects.p1, set: (p) => { projects[p.id] = p; } };
        }
        if (name === 'PageState') {
          return { get: () => ({ id: 'home', name: 'Home', projectId: 'p1' }), set: () => {}, getLastActive: () => null };
        }
        if (name === 'ProjectRepository') {
          return {
            findById: (id) => (projects[id] ? JSON.parse(JSON.stringify(projects[id])) : null),
            update: (p) => { projects[p.id] = p; },
          };
        }
        if (name === 'PageRepository') {
          return {
            findByProjectId: () => [{ id: 'home', name: 'Home', projectId: 'p1', styles: {} }],
            findById: () => ({ id: 'home', name: 'Home', projectId: 'p1', styles: {} }),
            getHomepage: () => ({ id: 'home', name: 'Home', projectId: 'p1' }),
          };
        }
        if (name === 'ComponentRepository') return { findByPage: () => [], saveAll: () => {} };
        if (name === 'HTMLRenderer') {
          return {
            render: (id) => {
              const p = projects[id];
              rendered = new CSSRenderer().render('', p.designVariants || [], p.styleScopes || []);
            },
          };
        }
        throw new Error(`unexpected container.get(${name})`);
      },
    };
    const router = new IntentRouter(container);
    return {
      router,
      scopes: () => JSON.parse(JSON.stringify(projects.p1.styleScopes || [])),
      site: () => [...(projects.p1.designVariants || [])],
      css: () => rendered,
      async cmd(c) {
        const analysis = new NLPEngine().analyze(c);
        return this.router._onRestyle(analysis, c);
      },
    };
  }

  it('sets a button scope without touching site variants', async () => {
    const t = scopedContainer();
    const res = await t.cmd('make all buttons playful');
    expect(res.reply).toContain('buttons are now playful');
    expect(t.scopes()).toEqual([{ scope: 'type:button', variants: ['playful'] }]);
    expect(t.site()).toEqual([]);
    // Scoped CSS: playful .btn rules present, after the base styles.
    expect(t.css()).toContain('Scoped: type:button');
    expect(t.css()).toContain('.btn { background-color: #7048e8');
    expect(t.css()).not.toContain('Design variant: playful');
  });

  it('replaces the scope on a new style (sticky)', async () => {
    const t = scopedContainer();
    await t.cmd('make all buttons playful');
    // Sticky: no "all" needed once the scope exists. Minimalist has
    // derived button rules, so the scope is REPLACED, not accumulated.
    const res = await t.cmd('now make the buttons minimalist');
    expect(res.reply).toContain('buttons are now minimalist');
    expect(t.scopes()).toEqual([{ scope: 'type:button', variants: ['minimalist'] }]);
    expect(t.css()).toContain('.btn { background-color: #111111');
  });

  it('splits "but keep the rest" into scope + site', async () => {
    const t = scopedContainer();
    const res = await t.cmd('make the buttons playful but keep the rest professional');
    expect(t.scopes()).toEqual([{ scope: 'type:button', variants: ['playful'] }]);
    expect(t.site()).toEqual(['professional']);
    expect(res.reply).toContain('rest of the site is professional');
    // Both blocks present; scoped after site.
    const css = t.css();
    expect(css.indexOf('Scoped: type:button')).toBeGreaterThan(css.indexOf('Design variant: professional'));
  });

  it('clears the scope', async () => {
    const t = scopedContainer();
    await t.cmd('make all buttons playful');
    const res = await t.cmd('clear the button styling');
    expect(res.reply).toContain('cleared');
    expect(t.scopes()).toEqual([]);
    expect(t.css()).not.toContain('Scoped:');
  });

  it('undo/redo restores scopes', async () => {
    const t = scopedContainer();
    const undo = async () => t.router._onUndo();
    const redo = async () => t.router._onRedo();
    await t.cmd('make all buttons playful');
    expect(t.scopes()).toHaveLength(1);
    await undo();
    expect(t.scopes()).toEqual([]);
    expect(t.css()).not.toContain('Scoped:');
    await redo();
    expect(t.scopes()).toEqual([{ scope: 'type:button', variants: ['playful'] }]);
    expect(t.css()).toContain('Scoped: type:button');
  });

  it('ambiguous "make the buttons playful" stays site-wide', async () => {
    const t = scopedContainer();
    await t.cmd('make the buttons playful');
    expect(t.scopes()).toEqual([]);
    expect(t.site()).toEqual(['playful']);
  });
});

describe('scoped restyling failure modes', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const CSSRenderer = require('../application/rendering/CSSRenderer.js');

  function badScopesContainer(badScopes) {
    const projects = { p1: { id: 'p1', name: 'Test', designVariants: [], styleScopes: badScopes } };
    const container = {
      get(name) {
        if (name === 'ProjectState') {
          return { get: () => projects.p1, set: (p) => { projects[p.id] = p; } };
        }
        if (name === 'PageState') {
          return { get: () => ({ id: 'home', name: 'Home', projectId: 'p1' }), set: () => {}, getLastActive: () => null };
        }
        if (name === 'ProjectRepository') {
          return {
            findById: (id) => (projects[id] ? JSON.parse(JSON.stringify(projects[id])) : null),
            update: (p) => { projects[p.id] = p; },
          };
        }
        if (name === 'PageRepository') {
          return {
            findByProjectId: () => [{ id: 'home', name: 'Home', projectId: 'p1', styles: {} }],
            findById: () => ({ id: 'home', name: 'Home', projectId: 'p1', styles: {} }),
            getHomepage: () => ({ id: 'home', name: 'Home', projectId: 'p1' }),
          };
        }
        if (name === 'ComponentRepository') return { findByPage: () => [], saveAll: () => {} };
        if (name === 'HTMLRenderer') return { render: () => {} };
        throw new Error(`unexpected container.get(${name})`);
      },
    };
    return { router: new IntentRouter(container), projects };
  }

  it('survives malformed persisted scopes without crashing', async () => {
    const bad = [
      { scope: 'type:button', variants: ['nonexistent'] },
      { bogus: 1 },
      null,
      'garbage',
      { scope: 'type:table', variants: ['playful'] },
    ];
    const { router, projects } = badScopesContainer(bad);
    // Sticky-scope detection must not throw on null entries.
    const analysis = new NLPEngine().analyze('make the buttons playful');
    const scope = router._detectScope(analysis, { project: projects.p1 });
    expect(scope).toBe('type:button');
    // Scoped handler must not throw; malformed entries are dropped,
    // well-formed ones (even for unsupported types) survive.
    const res = await router._onRestyle(analysis, 'make the buttons playful');
    expect(res.reply).toContain('buttons are now playful');
    expect(projects.p1.styleScopes).toEqual([
      { scope: 'type:button', variants: ['playful'] },
      { scope: 'type:table', variants: ['playful'] },
    ]);
  });

  it('renders nothing for unknown variants/types, never throws', () => {
    const r = new CSSRenderer();
    expect(r.getScopedStyles([{ scope: 'type:button', variants: ['nope'] }])).toBe('');
    expect(r.getScopedStyles([{ scope: 'type:table', variants: ['playful'] }])).toBe('');
    expect(r.getScopedStyles([null, {}, { scope: 'bogus' }])).toBe('');
    expect(r.getScopedStyles('garbage')).toBe('');
    expect(r.getScopedStyles(null)).toBe('');
  });
});

describe('section-scoped restyling', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const CSSRenderer = require('../application/rendering/CSSRenderer.js');
  const HTMLRenderer = require('../application/rendering/HTMLRenderer.js');

  const SECTIONED_COMPONENTS = [
    { id: 'c1', type: 'heading', content: 'Welcome', section: 'hero' },
    { id: 'c2', type: 'paragraph', content: 'Intro', section: 'hero' },
    { id: 'c3', type: 'button', content: 'Book Now', section: 'hero' },
    { id: 'c4', type: 'heading', content: 'Reviews', section: 'testimonials' },
    { id: 'c5', type: 'button', content: 'See Menu', section: 'cta' },
    { id: 'c6', type: 'paragraph', content: 'Loose note', section: null },
  ];

  it('groups tagged components into data-section wrappers; nested button is inside', () => {
    const html = new HTMLRenderer().renderComponents(SECTIONED_COMPONENTS, {});
    const heroBlock = html.match(/<section class="site-section" data-section="hero">([\s\S]*?)<\/section>/);
    expect(heroBlock).not.toBeNull();
    expect(heroBlock[1]).toContain('<button class="btn">Book Now</button>');
    expect(heroBlock[1]).toContain('Welcome');
    // The testimonials button is NOT in the hero; cta button is in cta.
    expect(html).toContain('data-section="testimonials"');
    expect(html).toContain('data-section="cta"');
    // Untagged component renders unwrapped.
    expect(html).toContain('<p class="paragraph">Loose note</p>');
    expect((html.match(/data-section=/g) || []).length).toBe(3);
  });

  it('untagged components render exactly as before (no wrappers)', () => {
    const html = new HTMLRenderer().renderComponents(
      [{ type: 'heading', content: 'Hi', section: null }, { type: 'button', content: 'Go' }],
      {}
    );
    expect(html).not.toContain('data-section');
    expect(html).not.toContain('site-section');
  });

  it('section CSS transform: body maps to the section, chrome is dropped', () => {
    const css = new CSSRenderer().getSectionCss('luxury', 'hero');
    expect(css).toContain('[data-section="hero"] { font-family: Georgia');
    expect(css).toContain('[data-section="hero"] .btn { background-color: #b8860b');
    expect(css).not.toContain('.navbar');
    expect(css).not.toContain('.footer');
    // Every selector is confined to the section.
    for (const line of css.split('\n')) {
      const sel = line.split('{')[0];
      expect(sel).toContain('[data-section="hero"]');
    }
  });

  function sectionContainer() {
    const projects = { p1: { id: 'p1', name: 'Test', designVariants: [], styleScopes: [] } };
    let renderedCss = '';
    const container = {
      get(name) {
        if (name === 'ProjectState') {
          return { get: () => projects.p1, set: (p) => { projects[p.id] = p; } };
        }
        if (name === 'PageState') {
          return { get: () => ({ id: 'home', name: 'Home', projectId: 'p1' }), set: () => {}, getLastActive: () => null };
        }
        if (name === 'ProjectRepository') {
          return {
            findById: (id) => (projects[id] ? JSON.parse(JSON.stringify(projects[id])) : null),
            update: (p) => { projects[p.id] = p; },
          };
        }
        if (name === 'PageRepository') {
          return {
            findByProjectId: () => [{ id: 'home', name: 'Home', projectId: 'p1', styles: {} }],
            findById: () => ({ id: 'home', name: 'Home', projectId: 'p1', styles: {} }),
            getHomepage: () => ({ id: 'home', name: 'Home', projectId: 'p1' }),
          };
        }
        if (name === 'ComponentRepository') {
          // Real signature: findByPage(projectId, pageId).
          return { findByPage: (projectId, pageId) => (pageId === 'home' ? SECTIONED_COMPONENTS : []), saveAll: () => {} };
        }
        if (name === 'HTMLRenderer') {
          return {
            render: (id) => {
              const p = projects[id];
              renderedCss = new CSSRenderer().render('', p.designVariants || [], p.styleScopes || []);
            },
          };
        }
        throw new Error(`unexpected container.get(${name})`);
      },
    };
    return {
      router: new IntentRouter(container),
      scopes: () => JSON.parse(JSON.stringify(projects.p1.styleScopes || [])),
      site: () => [...(projects.p1.designVariants || [])],
      css: () => renderedCss,
      async cmd(c) {
        const analysis = new NLPEngine().analyze(c);
        return this.router.route ? this.router._onRestyle(analysis, c) : null;
      },
    };
  }

  it('sets a hero section scope without touching site variants', async () => {
    const t = sectionContainer();
    const res = await t.cmd('make the hero section luxurious');
    expect(res.reply).toContain('hero section is now luxury');
    expect(t.scopes()).toEqual([{ scope: 'section:hero', variants: ['luxury'] }]);
    expect(t.site()).toEqual([]);
    const css = t.css();
    expect(css).toContain('Scoped: section:hero × luxury');
    expect(css).toContain('[data-section="hero"] .btn { background-color: #b8860b');
    // Isolation: no unscoped luxury, no other section touched.
    expect(css).not.toContain('Design variant: luxury');
    expect(css).not.toContain('[data-section="testimonials"]');
  });

  it('splits "but keep the rest professional" into section scope + site', async () => {
    const t = sectionContainer();
    await t.cmd('make the hero section luxurious but keep the rest professional');
    expect(t.scopes()).toEqual([{ scope: 'section:hero', variants: ['luxury'] }]);
    expect(t.site()).toEqual(['professional']);
  });

  it('combined scopes: hero luxury + playful buttons — playful wins inside hero', async () => {
    const t = sectionContainer();
    await t.cmd('make all buttons playful');
    await t.cmd('make the hero section luxurious');
    expect(t.scopes()).toEqual([
      { scope: 'type:button', variants: ['playful'] },
      { scope: 'section:hero', variants: ['luxury'] },
    ]);
    const css = t.css();
    const luxBtn = css.indexOf('[data-section="hero"] .btn { background-color: #b8860b');
    const playBtn = css.indexOf('[data-section="hero"] .btn { background-color: #7048e8');
    expect(luxBtn).toBeGreaterThan(-1);
    expect(playBtn).toBeGreaterThan(luxBtn); // cross rule comes later, wins ties
  });

  it('clearing the hero scope preserves the button scope and site variant', async () => {
    const t = sectionContainer();
    await t.cmd('make all buttons playful');
    await t.cmd('make the hero section luxurious but keep the rest professional');
    const res = await t.cmd('clear the hero section styling');
    expect(res.reply).toContain('cleared');
    expect(t.scopes()).toEqual([{ scope: 'type:button', variants: ['playful'] }]);
    expect(t.site()).toEqual(['professional']);
    expect(t.css()).not.toContain('[data-section="hero"]');
    expect(t.css()).toContain('Scoped: type:button');
  });

  it('undo/redo restores section scopes', async () => {
    const t = sectionContainer();
    await t.cmd('make the hero section luxurious');
    expect(t.scopes()).toHaveLength(1);
    await t.router._onUndo();
    expect(t.scopes()).toEqual([]);
    await t.router._onRedo();
    expect(t.scopes()).toEqual([{ scope: 'section:hero', variants: ['luxury'] }]);
  });

  it('unknown section gets an honest reply listing real sections', async () => {
    const t = sectionContainer();
    const res = await t.cmd('make the footer section luxurious');
    expect(res.reply).toContain('no "footer" section');
    expect(res.reply).toContain('hero');
    expect(t.scopes()).toEqual([]);
  });
});

describe('section grouping + export rehydration', () => {
  const { groupBySection } = require('../application/utils/sections.js');

  it('groups consecutive same-section components, breaks on gaps', () => {
    const comps = [
      { type: 'heading', section: 'hero' },
      { type: 'button', section: 'hero' },
      { type: 'paragraph', section: null },
      { type: 'heading', section: 'hero' },
      { type: 'cards', section: 'cta' },
    ];
    const groups = groupBySection(comps);
    expect(groups.map(g => [g.section, g.items.length])).toEqual([
      ['hero', 2],
      [null, 1],
      ['hero', 1],
      ['cta', 1],
    ]);
  });

  it('explicit section components are never grouped into a parent wrapper', () => {
    const groups = groupBySection([
      { type: 'section', section: 'hero', children: [] },
      { type: 'button', section: 'hero' },
    ]);
    expect(groups[0].section).toBeNull();
    expect(groups[1].section).toBe('hero');
  });

  it('ExportService rehydrates a restored stub before reading scopes', () => {
    const projectState = require('../application/state/ProjectState.js');
    const ExportService = require('../domain/services/ExportService.js');
    const full = { id: 'p1', name: 'T', designVariants: ['luxury'], styleScopes: [{ scope: 'section:hero', variants: ['luxury'] }] };
    try {
      projectState.set({ id: 'p1', _restored: true });
      const svc = new ExportService(null, null, null, { findById: (id) => (id === 'p1' ? full : null) });
      const active = svc.getActiveProject();
      expect(active.styleScopes).toEqual(full.styleScopes);
      expect(active.designVariants).toEqual(['luxury']);
      // State is upgraded in place, so later reads see the full record.
      expect(projectState.get()._restored).toBeUndefined();
    } finally {
      projectState.clear();
    }
  });
});

describe('multi-scope restyling in one prompt', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const CSSRenderer = require('../application/rendering/CSSRenderer.js');

  const COMPS = [
    { id: 'c1', type: 'heading', content: 'Welcome', section: 'hero' },
    { id: 'c2', type: 'button', content: 'Book', section: 'hero' },
    { id: 'c3', type: 'heading', content: 'Reviews', section: 'testimonials' },
    { id: 'c4', type: 'cards', content: '', section: 'testimonials' },
  ];

  function multiContainer(initialScopes = [], initialSite = []) {
    const projects = {
      p1: { id: 'p1', name: 'Test', designVariants: [...initialSite], styleScopes: JSON.parse(JSON.stringify(initialScopes)) },
    };
    let renderedCss = '';
    const container = {
      get(name) {
        if (name === 'ProjectState') {
          return { get: () => projects.p1, set: (p) => { projects[p.id] = p; } };
        }
        if (name === 'PageState') {
          return { get: () => ({ id: 'home', name: 'Home', projectId: 'p1' }), set: () => {}, getLastActive: () => null };
        }
        if (name === 'ProjectRepository') {
          return {
            findById: (id) => (projects[id] ? JSON.parse(JSON.stringify(projects[id])) : null),
            update: (p) => { projects[p.id] = p; },
          };
        }
        if (name === 'PageRepository') {
          return {
            findByProjectId: () => [{ id: 'home', name: 'Home', projectId: 'p1', styles: {} }],
            findById: () => ({ id: 'home', name: 'Home', projectId: 'p1', styles: {} }),
            getHomepage: () => ({ id: 'home', name: 'Home', projectId: 'p1' }),
          };
        }
        if (name === 'ComponentRepository') {
          return { findByPage: (pid, pageId) => (pageId === 'home' ? COMPS : []), saveAll: () => {} };
        }
        if (name === 'HTMLRenderer') {
          return {
            render: (id) => {
              const p = projects[id];
              renderedCss = new CSSRenderer().render('', p.designVariants || [], p.styleScopes || []);
            },
          };
        }
        throw new Error(`unexpected container.get(${name})`);
      },
    };
    const router = new IntentRouter(container);
    return {
      router,
      scopes: () => JSON.parse(JSON.stringify(projects.p1.styleScopes || [])),
      site: () => [...(projects.p1.designVariants || [])],
      css: () => renderedCss,
      async cmd(c) {
        const analysis = new NLPEngine().analyze(c);
        return router._onRestyle(analysis, c);
      },
    };
  }

  it('"hero luxurious but keep its buttons playful" sets section + type scopes', async () => {
    const t = multiContainer();
    const res = await t.cmd('Make the hero luxurious but keep its buttons playful.');
    expect(t.scopes()).toEqual([
      { scope: 'section:hero', variants: ['luxury'] },
      { scope: 'type:button', variants: ['playful'] },
    ]);
    expect(t.site()).toEqual([]);
    expect(res.reply).toContain('hero section is now luxury');
    expect(res.reply).toContain('buttons are now playful');
    // Cross rule: hero buttons stay playful.
    const css = t.css();
    expect(css.indexOf('[data-section="hero"] .btn { background-color: #7048e8'))
      .toBeGreaterThan(css.indexOf('[data-section="hero"] .btn { background-color: #b8860b'));
  });

  it('"hero luxurious and the testimonials warm" sets two section scopes', async () => {
    const t = multiContainer();
    await t.cmd('Make the hero luxurious and the testimonials warm.');
    expect(t.scopes()).toEqual([
      { scope: 'section:hero', variants: ['luxury'] },
      { scope: 'section:testimonials', variants: ['warm'] },
    ]);
    expect(t.css()).toContain('[data-section="testimonials"]');
  });

  it('three-way: hero minimalist + buttons playful + rest professional', async () => {
    const t = multiContainer();
    await t.cmd('Make the hero minimalist, but keep its buttons playful and the rest professional.');
    expect(t.scopes()).toEqual([
      { scope: 'section:hero', variants: ['minimalist'] },
      { scope: 'type:button', variants: ['playful'] },
    ]);
    expect(t.site()).toEqual(['professional']);
  });

  it('"cards colorful but leave the header unchanged" sets card scope only', async () => {
    const t = multiContainer([{ scope: 'section:hero', variants: ['luxury'] }], ['retro']);
    await t.cmd('Make the cards colorful but leave the header unchanged.');
    expect(t.scopes()).toEqual([
      { scope: 'section:hero', variants: ['luxury'] },
      { scope: 'type:card', variants: ['colorful'] },
    ]);
    expect(t.site()).toEqual(['retro']); // unrelated state preserved
    expect(t.css()).toContain('.card:nth-child(odd)');
  });

  it('conflicting instructions for one target: last wins, deterministically', async () => {
    const t = multiContainer();
    await t.cmd('Make the hero luxurious and the hero warm.');
    expect(t.scopes()).toEqual([{ scope: 'section:hero', variants: ['warm'] }]);
  });

  it('unsupported target aborts everything — nothing is applied', async () => {
    const t = multiContainer();
    const res = await t.cmd('Make the hero luxurious and the footer section warm.');
    expect(res.reply).toContain('Nothing was changed');
    expect(res.reply).toContain('no "footer" section');
    expect(t.scopes()).toEqual([]);
    expect(t.site()).toEqual([]);
  });

  it('unsupported type style aborts everything', async () => {
    const t = multiContainer();
    const res = await t.cmd('Make the buttons oversized and the hero luxurious.');
    expect(res.reply).toContain('Nothing was changed');
    expect(t.scopes()).toEqual([]);
  });

  it('the whole multi-scope change is ONE undoable action', async () => {
    const t = multiContainer([{ scope: 'type:card', variants: ['retro'] }], ['rustic']);
    await t.cmd('Make the hero luxurious but keep its buttons playful.');
    expect(t.scopes()).toHaveLength(3);
    await t.router._onUndo();
    // Entire previous state restored in a single undo.
    expect(t.scopes()).toEqual([{ scope: 'type:card', variants: ['retro'] }]);
    expect(t.site()).toEqual(['rustic']);
    await t.router._onRedo();
    expect(t.scopes()).toHaveLength(3);
    expect(t.site()).toEqual(['rustic']);
  });

  it('single ambiguous prompts still fall through to legacy behavior', async () => {
    const t = multiContainer();
    await t.cmd('make the buttons playful');
    expect(t.scopes()).toEqual([]);
    expect(t.site()).toEqual(['playful']); // site-wide, per ambiguity policy
  });
});

describe('multi-scope preservation and abort hardening', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const CSSRenderer = require('../application/rendering/CSSRenderer.js');

  const COMPS = [
    { id: 'c1', type: 'heading', content: 'Welcome', section: 'hero' },
    { id: 'c2', type: 'button', content: 'Book', section: 'hero' },
    { id: 'c3', type: 'heading', content: 'Reviews', section: 'testimonials' },
  ];

  function statefulContainer() {
    const projects = {
      p1: {
        id: 'p1', name: 'Test',
        designVariants: ['rustic'],
        styleScopes: [
          { scope: 'section:testimonials', variants: ['warm'] },
          { scope: 'type:card', variants: ['retro'] },
        ],
      },
    };
    let renderedCss = '';
    const renderNow = () => {
      renderedCss = new CSSRenderer().render('', projects.p1.designVariants || [], projects.p1.styleScopes || []);
    };
    renderNow();
    const container = {
      get(name) {
        if (name === 'ProjectState') {
          return { get: () => projects.p1, set: (p) => { projects[p.id] = p; } };
        }
        if (name === 'PageState') {
          return { get: () => ({ id: 'home', name: 'Home', projectId: 'p1' }), set: () => {}, getLastActive: () => null };
        }
        if (name === 'ProjectRepository') {
          return {
            findById: (id) => (projects[id] ? JSON.parse(JSON.stringify(projects[id])) : null),
            update: (p) => { projects[p.id] = p; },
          };
        }
        if (name === 'PageRepository') {
          return {
            findByProjectId: () => [{ id: 'home', name: 'Home', projectId: 'p1', styles: {} }],
            findById: () => ({ id: 'home', name: 'Home', projectId: 'p1', styles: {} }),
            getHomepage: () => ({ id: 'home', name: 'Home', projectId: 'p1' }),
          };
        }
        if (name === 'ComponentRepository') {
          return { findByPage: (pid, pageId) => (pageId === 'home' ? COMPS : []), saveAll: () => {} };
        }
        if (name === 'HTMLRenderer') return { render: () => renderNow() };
        throw new Error(`unexpected container.get(${name})`);
      },
    };
    const router = new IntentRouter(container);
    return {
      router,
      snapshot: () => JSON.stringify({
        scopes: projects.p1.styleScopes, site: projects.p1.designVariants, css: renderedCss,
      }),
      async cmd(c) {
        const analysis = new NLPEngine().analyze(c);
        return router._onRestyle(analysis, c);
      },
    };
  }

  it('an unsupported clause aborts with pre-existing state byte-identical', async () => {
    const t = statefulContainer();
    const before = t.snapshot();
    const res = await t.cmd('Make the hero luxurious and the footer section warm.');
    expect(res.reply).toContain('Nothing was changed');
    expect(t.snapshot()).toBe(before);
    // And no undo entry was pushed for the aborted operation.
    const undoRes = await t.router._onUndo();
    expect(undoRes.reply).toContain('Nothing to undo');
  });

  it('a targeted multi op preserves every unrelated scope', async () => {
    const t = statefulContainer();
    await t.cmd('Make the hero luxurious and the testimonials warm.');
    const after = JSON.parse(t.snapshot());
    // testimonials was targeted (same variants — no visible change),
    // card scope and site were NOT targeted and must be untouched.
    expect(after.scopes).toContainEqual({ scope: 'type:card', variants: ['retro'] });
    expect(after.scopes).toContainEqual({ scope: 'section:testimonials', variants: ['warm'] });
    expect(after.scopes).toContainEqual({ scope: 'section:hero', variants: ['luxury'] });
    expect(after.site).toEqual(['rustic']);
  });

  it('a site pair in a multi op replaces site but preserves all scopes', async () => {
    const t = statefulContainer();
    await t.cmd('Make the hero luxurious and the rest professional.');
    const after = JSON.parse(t.snapshot());
    expect(after.site).toEqual(['professional']);
    expect(after.scopes).toContainEqual({ scope: 'section:testimonials', variants: ['warm'] });
    expect(after.scopes).toContainEqual({ scope: 'type:card', variants: ['retro'] });
  });
});

describe('heading and paragraph scopes', () => {
  const NLPEngine = require('../application/nlp/NLPEngine.js');
  const CSSRenderer = require('../application/rendering/CSSRenderer.js');

  const COMPS = [
    { id: 'c1', type: 'heading', content: 'Welcome', section: 'hero' },
    { id: 'c2', type: 'paragraph', content: 'Intro', section: 'hero' },
    { id: 'c3', type: 'heading', content: 'Reviews', section: 'testimonials' },
    { id: 'c4', type: 'paragraph', content: 'Quotes', section: 'testimonials' },
  ];

  function hpContainer() {
    const projects = { p1: { id: 'p1', name: 'Test', designVariants: [], styleScopes: [] } };
    let renderedCss = '';
    const container = {
      get(name) {
        if (name === 'ProjectState') {
          return { get: () => projects.p1, set: (p) => { projects[p.id] = p; } };
        }
        if (name === 'PageState') {
          return { get: () => ({ id: 'home', name: 'Home', projectId: 'p1' }), set: () => {}, getLastActive: () => null };
        }
        if (name === 'ProjectRepository') {
          return {
            findById: (id) => (projects[id] ? JSON.parse(JSON.stringify(projects[id])) : null),
            update: (p) => { projects[p.id] = p; },
          };
        }
        if (name === 'PageRepository') {
          return {
            findByProjectId: () => [{ id: 'home', name: 'Home', projectId: 'p1', styles: {} }],
            findById: () => ({ id: 'home', name: 'Home', projectId: 'p1', styles: {} }),
            getHomepage: () => ({ id: 'home', name: 'Home', projectId: 'p1' }),
          };
        }
        if (name === 'ComponentRepository') {
          return { findByPage: (pid, pageId) => (pageId === 'home' ? COMPS : []), saveAll: () => {} };
        }
        if (name === 'HTMLRenderer') {
          return {
            render: (id) => {
              const p = projects[id];
              renderedCss = new CSSRenderer().render('', p.designVariants || [], p.styleScopes || []);
            },
          };
        }
        throw new Error(`unexpected container.get(${name})`);
      },
    };
    const router = new IntentRouter(container);
    return {
      router,
      scopes: () => JSON.parse(JSON.stringify(projects.p1.styleScopes || [])),
      css: () => renderedCss,
      async cmd(c) {
        const analysis = new NLPEngine().analyze(c);
        return router._onRestyle(analysis, c);
      },
    };
  }

  it('single-scope: "make all headings playful" sets type:heading', async () => {
    const t = hpContainer();
    const res = await t.cmd('make all headings playful');
    expect(res.reply).toContain('headings are now playful');
    expect(t.scopes()).toEqual([{ scope: 'type:heading', variants: ['playful'] }]);
    expect(t.css()).toContain('Scoped: type:heading × playful');
    // Only class selectors — no bare h1 that would hit card titles etc.
    const block = t.css().split('Scoped: type:heading × playful')[1];
    expect(block).not.toMatch(/\nh[1-6] \{/);
  });

  it('single-scope: "make all paragraphs warm" sets type:paragraph', async () => {
    const t = hpContainer();
    await t.cmd('make all paragraphs warm');
    expect(t.scopes()).toEqual([{ scope: 'type:paragraph', variants: ['warm'] }]);
    expect(t.css()).toContain('.paragraph {');
  });

  it('honest refusal when the variant has no paragraph rules (luxury)', async () => {
    const t = hpContainer();
    const res = await t.cmd('make all paragraphs luxurious');
    expect(res.reply).toContain('I can style paragraphs with:');
    expect(res.reply).not.toContain('luxury');
    expect(t.scopes()).toEqual([]);
  });

  it('combined cascade: hero luxury + headings playful — type wins inside the section', async () => {
    const t = hpContainer();
    await t.cmd('Make the hero luxurious but keep its headings playful.');
    expect(t.scopes()).toEqual([
      { scope: 'section:hero', variants: ['luxury'] },
      { scope: 'type:heading', variants: ['playful'] },
    ]);
    const css = t.css();
    const sectionRule = css.indexOf('[data-section="hero"] .heading');
    const crossRule = css.indexOf('[data-section="hero"] .heading { color: #d9480f');
    expect(sectionRule).toBeGreaterThan(-1);
    // The type-inside-section cross rule comes later -> headings in the
    // hero stay playful despite the section's luxury heading color.
    expect(crossRule).toBeGreaterThan(sectionRule);
  });

  it('heading scope is undoable and redoable as one action', async () => {
    const t = hpContainer();
    await t.cmd('make all headings playful');
    await t.router._onUndo();
    expect(t.scopes()).toEqual([]);
    await t.router._onRedo();
    expect(t.scopes()).toEqual([{ scope: 'type:heading', variants: ['playful'] }]);
  });

  it('multi-scope with headings and paragraphs together', async () => {
    const t = hpContainer();
    await t.cmd('Make the headings minimalist and the paragraphs warm.');
    expect(t.scopes()).toEqual([
      { scope: 'type:heading', variants: ['minimalist'] },
      { scope: 'type:paragraph', variants: ['warm'] },
    ]);
  });
});
