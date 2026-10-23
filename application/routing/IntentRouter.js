/**
 * IntentRouter
 *
 * The conversational heart of Prompt2Page. Takes a raw user message,
 * runs it through the NLP engine, and executes the understood intent
 * against the use cases. There is no command syntax — "i need a
 * restaurant website", "build me a resto site" and "restaurant website
 * please" all arrive here as BUILD_WEBSITE.
 *
 * Rules:
 *   - UNKNOWN intent or low confidence → a clarification question,
 *     never an "Unknown command" error.
 *   - Every state-modifying action snapshots first → real UNDO/REDO.
 *   - Replies are plain sentences, never command syntax.
 */
const NLPEngine = require('../nlp/NLPEngine');
const TargetResolver = require('./TargetResolver');
const responseBuilder = require('../../presentation/helpers/responseBuilder');

const COLOR_WORDS = {
  red: '#e53e3e', blue: '#3182ce', green: '#38a169', yellow: '#d69e2e',
  orange: '#dd6b20', purple: '#805ad5', pink: '#d53f8c', black: '#1a202c',
  white: '#ffffff', gray: '#718096', grey: '#718096',
};

// Natural section words → knowledge template keys (checked in order).
const SECTION_WORDS = [
  [/testimonial/, 'Testimonials'],
  [/galler/, 'Gallery'],
  [/menu/, 'MenuGrid'],
  [/pric/, 'Pricing'],
  [/\bfaq\b|frequently asked/, 'FAQ'],
  [/booking|reservation/, 'BookingForm'],
  [/(contact )?form/, 'ContactForm'],
  [/hour/, 'Hours'],
  [/location|\bmap\b/, 'Map'],
  [/team/, 'Team'],
  [/stor|about/, 'Story'],
  [/feature/, 'Features'],
  [/special/, 'Specials'],
  [/hero/, 'Hero'],
];

// Templates for sections with no knowledge entry.
const FALLBACK_SECTIONS = {
  Pricing: [
    { type: 'heading', content: 'Pricing', properties: { level: 2 } },
    { type: 'paragraph', content: 'Simple, honest pricing. Pick the plan that fits you best.' },
    { type: 'button', content: 'Get Started', properties: {} },
  ],
  FAQ: [
    { type: 'heading', content: 'Frequently Asked Questions', properties: { level: 2 } },
    { type: 'paragraph', content: 'Have a question? You will find the answer here.' },
  ],
};

class IntentRouter {
  constructor(container) {
    this.container = container;
    this.nlp = new NLPEngine();
    this.targets = new TargetResolver();
    this.undoStack = [];
    this.redoStack = [];
  }

  // ── Entry point ──────────────────────────────────────────────

  async route(rawInput, tooLong = false) {
    const input = (rawInput || '').trim();
    if (tooLong) return this._reply('That message is a bit long for me — could you shorten it to a sentence or two?', false);
    if (!input) return this._reply('Tell me what you want — for example, "I need a restaurant website".', false);

    const analysis = this.nlp.analyze(input);

    if (analysis.intent === 'UNKNOWN' || (analysis.confidence || 0) < 0.3) {
      return this._clarify(analysis);
    }

    const handler = this[`_on${toHandlerName(analysis.intent)}`];
    if (typeof handler !== 'function') return this._clarify(analysis);

    try {
      return await handler.call(this, analysis, input);
    } catch (error) {
      console.error('IntentRouter error:', error);
      return this._reply('Something went wrong on my side. Could you try saying that differently?', false);
    }
  }

  // ── Intent handlers ──────────────────────────────────────────

  async _onBuildWebsite(analysis, rawInput) {
    const websiteCommands = require('../../commands/website');
    const result = websiteCommands.generate({ prompt: rawInput });
    if (!result.success) {
      const errText = result.reply || result.error || '';
      if (/already exists/i.test(errText)) {
        return this._reply(
          'A site with that name already exists. Tell me a different name, or say "rebuild it" and I will start fresh.',
          false
        );
      }
      return this._reply(
        `I couldn't build that yet${errText ? ': ' + errText : ''}. Try "I need a restaurant website".`,
        false
      );
    }
    const business = analysis.entities && analysis.entities.business;
    const payload = (result && result.data) || result || {};
    const built = payload.project || {};
    const name = built.name || built.id || 'your site';
    if (business) this.lastBusiness = business;
    // The build pipeline (WebsiteGenerator) does not consume plan
    // styles/themes/constraints, so honor a recognized color-scheme directive
    // here using the same theme definitions as the APPLY_THEME intent.
    // constraints.colorScheme only ever holds 'dark' or 'light' (see
    // dictionaries/constraints/colors.js), both of which are theme keys.
    const colorScheme = analysis.constraints && analysis.constraints.colorScheme;
    const buildTheme = colorScheme ? IntentRouter.THEMES[colorScheme] : null;
    let themeNote = '';
    let needsRender = false;
    if (buildTheme && built.id) {
      const pageRepo = this.container.get('PageRepository');
      const builtPages = pageRepo.findByProjectId(built.id) || [];
      for (const bp of builtPages) {
        this._updatePageStyles({ project: built, pageId: bp.id }, buildTheme.styles);
      }
      needsRender = true;
      themeNote = ` with the ${buildTheme.name} theme applied`;
    }
    // Persist the user's creative directions as design variants so the
    // generated stylesheet reflects the prompt's styles/themes instead of
    // the one fixed template. Variants are cosmetic; never fail the build.
    const designVariants = [...new Set([...(analysis.styles || []), ...(analysis.themes || [])])]
      .map((v) => String(v).toLowerCase().trim())
      .filter(Boolean);
    if (designVariants.length && built.id) {
      try {
        const projectRepo = this.container.get('ProjectRepository');
        const stored = (projectRepo.findById && projectRepo.findById(built.id)) || built;
        stored.designVariants = designVariants;
        if (projectRepo.update) projectRepo.update(stored);
      } catch (e) { /* cosmetic only */ }
      needsRender = true;
    }
    if (needsRender) this._render(built.id);
    this._pushUndo(); // snapshot the fresh site for "undo that"
    // Page-count note: confirm the honored count, or explain an adjustment.
    const requestedCount = analysis.constraints && analysis.constraints.pageCount;
    let pageNote = '';
    if (requestedCount && built.id) {
      const builtPages = (this.container.get('PageRepository').findByProjectId(built.id) || []);
      if (builtPages.length !== requestedCount) {
        pageNote = ` Note: you asked for ${requestedCount} pages, but this blueprint has ${builtPages.length} pages with real content, so I built all ${builtPages.length} instead of adding empty pages.`;
      } else if (builtPages.length === 1) {
        pageNote = ' Built as a single page with every section merged in.';
      }
    }
    return this._reply(
      'Done — I built ' + name + (business ? ' (' + business + ' site)' : '') + themeNote +
      ' with a live preview on the right. ' +
      'Tell me what to change: colors, headlines, new sections, anything.' + pageNote,
      true,
      result
    );
  }

  async _onAddSection(analysis) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const templateKey = this._sectionKey(analysis.normalizedPrompt);
    const items = this._expandSection(templateKey, ctx.project);
    if (!items.length) return this._reply(`I don't have a "${templateKey}" section yet. Try "testimonials", "gallery", "menu" or "pricing".`, false);

    this._pushUndo(ctx);
    const useCase = this.container.get('ComponentUseCase');
    let added = 0;
    for (const item of items) {
      const r = useCase.add({ pageId: ctx.pageId, type: item.type, content: item.content, level: item.level, alt: item.alt, section: item.section });
      if (r.success) added++;
    }
    this._render(ctx.project.id);
    return this._reply(
      added ? `Added a ${humanize(templateKey)} section to the page.` : 'I could not add that section.',
      !!added
    );
  }

  async _onAddPage(analysis) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const m = analysis.normalizedPrompt.match(/\b(?:add|create|make)(?: a| an)? ([a-z][a-z0-9 -]*?)\s+page\b/);
    let name = m ? capitalize(m[1].trim()) : 'New Page';
    if (name.toLowerCase() === 'new') name = 'New Page'; // "add a new page" — "new" is filler, not a name
    this._pushUndo(ctx);
    const pageUseCase = this.container.get('PageUseCase');
    const result = pageUseCase.create({ name });
    if (!result.success) return this._reply(`I couldn't create that page: ${result.error || result.reply || 'unknown error'}.`, false);
    // Actually switch to the new page — subsequent commands target the active page.
    const newPage = result.page || (result.data && result.data.page);
    if (newPage) this.container.get('PageState').set(newPage);
    this._render(ctx.project.id);
    return this._reply(`Created the ${name} page and switched to it. What should go on it?`, true);
  }

  async _onSwitchPage(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const pageRepo = this.container.get('PageRepository');
    const pages = pageRepo.findByProjectId(ctx.project.id) || [];
    const name = extractSwitchPageName(rawInput);
    if (!name) {
      const list = pages.map((p) => p.name).join(', ') || 'no pages yet';
      return this._reply(`Which page should I switch to? This site has: ${list}.`, false);
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    const target = pages.find((p) =>
      (p.name && p.name.toLowerCase() === name.toLowerCase()) || p.id === slug
    );
    if (!target) {
      return this._reply(
        `I don't see a "${name}" page in ${ctx.project.name}. Say "add a ${name} page" and I'll create it.`,
        false
      );
    }
    this.container.get('PageState').set(target);
    this._render(ctx.project.id);
    return this._reply(`Switched to the ${target.name} page.`, true);
  }

  // ── Media library ────────────────────────────────────────────

  _assetCards(ctx) {
    const useCase = this.container.get('AssetUseCase');
    const result = useCase.list();
    const assets = (result.assets || []).map((a) => {
      const j = typeof a.toJSON === 'function' ? a.toJSON() : a;
      return {
        ...j,
        url: `/assets/${ctx.project.id}/${j.fileName}`,
        size: j.fileSize,
        modifiedAt: j.updatedAt || j.createdAt,
      };
    });
    return assets;
  }

  async _onListAssets() {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const assets = this._assetCards(ctx);
    if (!assets.length) {
      return this._reply(
        'No images uploaded yet. Click the paperclip next to the chat box (or drag a photo in) to upload one.',
        false,
        { assets: [] }
      );
    }
    const names = assets.map((a) => a.fileName).join(', ');
    return this._reply(`You've got ${assets.length} image${assets.length === 1 ? '' : 's'}: ${names}.`, false, { assets });
  }

  async _onRenameAsset(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const m = String(rawInput || '').match(/\brename\b\s+(?:asset\s+)?([\w.-]+\.(?:png|jpe?g|gif|webp))\s+to\s+([\w.-]+\.(?:png|jpe?g|gif|webp))/i);
    if (!m) {
      return this._reply('Which image should I rename? For example: "rename logo.png to logo-new.png".', false);
    }
    const oldName = m[1].toLowerCase();
    const newName = m[2].toLowerCase();
    const result = this.container.get('AssetUseCase').rename({ fileName: oldName, newFileName: newName });
    if (!result.success) return this._reply(`Couldn't rename it: ${result.error || 'unknown error'}.`, false);
    // Keep pages pointing at the renamed file — update any image src using the old URL.
    const oldUrl = `/assets/${ctx.project.id}/${oldName}`;
    const newUrl = `/assets/${ctx.project.id}/${newName}`;
    const compRepo = this.container.get('ComponentRepository');
    const pageRepo = this.container.get('PageRepository');
    let touched = false;
    for (const page of pageRepo.findByProjectId(ctx.project.id) || []) {
      const comps = compRepo.findByPage(ctx.project.id, page.id) || [];
      let changed = false;
      for (const c of comps) {
        if ((c.type || '').toLowerCase() === 'image' && c.content === oldUrl) {
          c.content = newUrl;
          changed = true;
        }
      }
      if (changed) { compRepo.saveAll(ctx.project.id, page.id, comps); touched = true; }
    }
    if (touched) this._render(ctx.project.id);
    return this._reply(`Renamed ${m[1]} to ${m[2]}.`, touched, { assets: this._assetCards(ctx) });
  }

  async _onDeleteAsset(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const m = String(rawInput || '').match(/\bdelete\b\s+(?:asset\s+)?([\w.-]+\.(?:png|jpe?g|gif|webp))/i);
    if (!m) {
      return this._reply('Which image should I delete? For example: "delete logo.png".', false);
    }
    const fileName = m[1].toLowerCase();
    this._pushUndo(ctx);
    const result = this.container.get('AssetUseCase').delete({ fileName });
    if (!result.success) return this._reply(`Couldn't delete it: ${result.error || 'unknown error'}.`, false);
    // Pages using the deleted file fall back to the placeholder, not a broken image.
    const deadUrl = `/assets/${ctx.project.id}/${fileName}`;
    const compRepo = this.container.get('ComponentRepository');
    const pageRepo = this.container.get('PageRepository');
    for (const page of pageRepo.findByProjectId(ctx.project.id) || []) {
      const comps = compRepo.findByPage(ctx.project.id, page.id) || [];
      let changed = false;
      for (const c of comps) {
        if ((c.type || '').toLowerCase() === 'image' && c.content === deadUrl) {
          c.content = '';
          changed = true;
        }
      }
      if (changed) compRepo.saveAll(ctx.project.id, page.id, comps);
    }
    this._render(ctx.project.id);
    return this._reply(`Deleted ${m[1]}.`, true, { assets: this._assetCards(ctx) });
  }

  async _onUseImage(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const text = String(rawInput || '');
    const fileM = text.match(/([\w.-]+\.(?:png|jpe?g|gif|webp))/i);
    if (!fileM) {
      return this._reply('Which image? Upload one first (paperclip button), then say "use logo.png as the hero image".', false);
    }
    const fileName = fileM[1].toLowerCase();
    const assets = this._assetCards(ctx);
    const asset = assets.find((a) => a.fileName.toLowerCase() === fileName);
    if (!asset) {
      return this._reply(`I don't see "${fileM[1]}" in your uploads. Say "list assets" to see what's there.`, false);
    }
    const wantHero = /\bhero\b/i.test(text);
    const images = (ctx.components || []).filter((c) => (c.type || '').toLowerCase() === 'image');
    if (!images.length) {
      return this._reply("This page doesn't have an image spot yet. Say \"add a hero section\" first.", false);
    }
    let target = null;
    if (wantHero) {
      target = images.find((c) => /hero/i.test((c.alt || '') + ' ' + (c.content || ''))) || images[0];
    } else {
      target = images[0];
    }
    this._pushUndo(ctx);
    const useCase = this.container.get('ComponentUseCase');
    const result = useCase.edit({
      pageId: ctx.pageId,
      componentId: target.id,
      content: asset.url,
      alt: asset.fileName,
    });
    if (!result.success) return this._reply(`Couldn't set the image: ${result.error || 'unknown error'}.`, false);
    this._render(ctx.project.id);
    return this._reply(`Done — ${asset.fileName} is now the ${wantHero ? 'hero image' : 'page image'}.`, true);
  }

  // ── Projects ─────────────────────────────────────────────────

  _findProjectByName(name) {
    if (!name) return null;
    const projectRepo = this.container.get('ProjectRepository');
    const projects = projectRepo.findAll ? projectRepo.findAll() : [];
    // Try the full name first ("Bakery Project"), then with a trailing filler
    // word stripped ("switch to the bakery site" → "bakery").
    const variants = [...new Set([
      name,
      name.replace(/\s+(site|website|project)\s*$/i, '').trim(),
    ].filter(Boolean))];
    for (const variant of variants) {
      const slug = variant.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      const found = projects.find((p) =>
        (p.name && p.name.toLowerCase() === variant.toLowerCase()) || p.id === slug
      );
      if (found) return found;
    }
    return null;
  }

  _extractProjectName(rawInput) {
    const m = String(rawInput || '').match(/\b(?:switch|open|go|delete|remove)\b(?:\s+to)?\s+(?:the\s+|my\s+)?([a-z0-9][a-z0-9\s-]*?)\s*$/i);
    if (!m) return null;
    // Keep the full capture — "Bakery Project" is a real name. The trailing
    // filler word is only stripped as a fallback during lookup.
    const name = m[1].trim();
    return name || null;
  }

  _activateProject(project) {
    const projectState = this.container.get('ProjectState');
    const pageState = this.container.get('PageState');
    const pageRepo = this.container.get('PageRepository');
    projectState.set(project);
    const home = pageRepo.getHomepage
      ? pageRepo.getHomepage(project.id)
      : (pageRepo.findByProjectId(project.id) || [])[0];
    if (home && pageState.set) pageState.set(home);
    this._render(project.id);
  }

  async _onListProjects() {
    const projectRepo = this.container.get('ProjectRepository');
    const pageRepo = this.container.get('PageRepository');
    const projects = projectRepo.findAll ? projectRepo.findAll() : [];
    const active = this.container.get('ProjectState').get();
    const cards = projects.map((p) => ({
      id: p.id,
      name: p.name || p.id,
      pageCount: (pageRepo.findByProjectId(p.id) || []).length,
      isActive: active ? active.id === p.id : false,
    }));
    if (!projects.length) {
      return this._reply('No sites yet. Say "i need a bakery website" and I\'ll build your first one.', false, { projects: [] });
    }
    const names = cards.map((c) => c.name).join(', ');
    return this._reply(`You've got ${cards.length} site${cards.length === 1 ? '' : 's'}: ${names}.`, false, { projects: cards });
  }

  async _onSwitchProject(analysis, rawInput) {
    const name = this._extractProjectName(rawInput);
    const target = this._findProjectByName(name);
    if (!target) {
      const projectRepo = this.container.get('ProjectRepository');
      const projects = projectRepo.findAll ? projectRepo.findAll() : [];
      const list = projects.map((p) => p.name || p.id).join(', ') || 'no sites yet';
      return this._reply(`Which site? You've got: ${list}.`, false);
    }
    this._activateProject(target);
    return this._reply(`Switched to ${target.name || target.id}.`, true);
  }

  async _onDeleteProject(analysis, rawInput) {
    const projectRepo = this.container.get('ProjectRepository');
    const projects = projectRepo.findAll ? projectRepo.findAll() : [];
    if (!projects.length) return this._reply('No sites to delete.', false);
    const saysThis = /\bthis\b/i.test(String(rawInput || ''));
    const name = saysThis ? null : this._extractProjectName(rawInput);
    const target = saysThis
      ? this.container.get('ProjectState').get()
      : this._findProjectByName(name);
    if (!target) {
      const list = projects.map((p) => p.name || p.id).join(', ');
      return this._reply(`Which site should I delete? You've got: ${list}.`, false);
    }
    this._pushUndo(this._context());
    const result = this.container.get('ProjectUseCase').delete({ id: target.id });
    if (!result.success) return this._reply(`Couldn't delete it: ${result.error || 'unknown error'}.`, false);
    // Fall back to another site, or nothing.
    const remaining = (projectRepo.findAll ? projectRepo.findAll() : []).filter((p) => p.id !== target.id);
    if (remaining.length) this._activateProject(remaining[0]);
    else {
      const projectState = this.container.get('ProjectState');
      if (projectState.clear) projectState.clear();
      this._render(null);
    }
    return this._reply(`Deleted ${target.name || target.id}.`, true);
  }

  async _onReset() {    const projectRepo = this.container.get('ProjectRepository');
    const projects = projectRepo.findAll ? projectRepo.findAll() : [];
    const useCase = this.container.get('ProjectUseCase');
    let count = 0;
    for (const p of projects) {
      const r = useCase.delete({ id: p.id });
      if (r && r.success) count++;
    }
    const pageState = this.container.get('PageState');
    if (pageState.clear) pageState.clear();
    const projectState = this.container.get('ProjectState');
    if (projectState.clear) projectState.clear();
    this._render(null);
    return this._reply(
      count ? `Done — deleted ${count} site${count === 1 ? '' : 's'}. Fresh canvas.` : 'Nothing to delete — no sites yet.',
      false
    );
  }

  // ── Page management ──────────────────────────────────────────

  _findPageByName(ctx, name) {
    if (!name) return null;
    const pageRepo = this.container.get('PageRepository');
    const pages = pageRepo.findByProjectId(ctx.project.id) || [];
    const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    return pages.find((p) =>
      (p.name && p.name.toLowerCase() === name.toLowerCase()) || p.id === slug
    ) || null;
  }

  _extractPageActionName(rawInput, verb) {
    const m = String(rawInput || '').match(new RegExp(`\\b${verb}\\b\\s+(?:the\\s+)?([a-z0-9][a-z0-9\\s-]*?)(?:\\s+page)?\\s*(?:\\bto\\b|$)`, 'i'));
    if (!m) return null;
    return m[1].replace(/\s+page\s*$/i, '').trim() || null;
  }

  async _onDuplicatePage(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const name = this._extractPageActionName(rawInput, '(?:duplicate|copy|clone)');
    const source = this._findPageByName(ctx, name) || (ctx.pageId ? { id: ctx.pageId, name: 'current page' } : null);
    if (!source || !source.id) {
      return this._reply('Which page should I duplicate?', false);
    }
    const srcPage = this.container.get('PageRepository').findById
      ? this.container.get('PageRepository').findById(ctx.project.id, source.id)
      : null;
    if (!srcPage) return this._reply("Couldn't find that page.", false);
    this._pushUndo(ctx);
    const pageUseCase = this.container.get('PageUseCase');
    const newName = `${srcPage.name} copy`;
    const created = pageUseCase.create({ projectId: ctx.project.id, name: newName });
    if (!created.success || !created.page) {
      return this._reply(`Couldn't duplicate it: ${created.error || 'unknown error'}.`, false);
    }
    // Copy components across.
    const compRepo = this.container.get('ComponentRepository');
    const comps = compRepo.findByPage(ctx.project.id, srcPage.id) || [];
    const compUseCase = this.container.get('ComponentUseCase');
    for (const c of comps) {
      const j = typeof c.toJSON === 'function' ? c.toJSON() : c;
      compUseCase.add({
        pageId: created.page.id,
        type: j.type,
        content: j.content,
        level: j.level,
        alt: j.alt,
        section: j.section,
        properties: j.properties || {},
      });
    }
    this._render(ctx.project.id);
    return this._reply(`Duplicated as "${newName}".`, true);
  }

  async _onPageSeo(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const text = String(rawInput || '');
    const isTitle = /\btitle\b/i.test(text);
    const m = text.match(/\b(?:title|description)\b\s+(?:to\s+|is\s+)?["']?([^"']+)["']?$/i);
    const value = m ? m[1].trim() : null;
    if (!value) {
      return this._reply(`What should the page ${isTitle ? 'title' : 'description'} be? For example: "set the page title to Welcome to ${ctx.project.name}".`, false);
    }
    const pageRepo = this.container.get('PageRepository');
    const page = pageRepo.findById ? pageRepo.findById(ctx.project.id, ctx.pageId) : null;
    if (!page) return this._reply("Couldn't find the current page.", false);
    this._pushUndo(ctx);
    if (isTitle) page.seoTitle = value.slice(0, 70);
    else page.seoDescription = value.slice(0, 160);
    if (pageRepo.update) pageRepo.update(page);
    else if (pageRepo.save) pageRepo.save(page);
    this._render(ctx.project.id);
    return this._reply(`Done — page ${isTitle ? 'title' : 'description'} updated.`, true);
  }

  async _onListPages() {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const pageRepo = this.container.get('PageRepository');
    const pages = pageRepo.findByProjectId(ctx.project.id) || [];
    const pageState = this.container.get('PageState');
    const active = pageState.get && pageState.get();
    const cards = pages.map((p) => ({
      id: p.id,
      name: p.name,
      isHomepage: !!p.isHomepage,
      isActive: active ? active.id === p.id : !!p.isActive,
    }));
    if (!pages.length) {
      return this._reply('No pages yet.', false, { pages: [] });
    }
    const names = pages.map((p) => p.name).join(', ');
    return this._reply(`This site has ${pages.length} page${pages.length === 1 ? '' : 's'}: ${names}.`, false, { pages: cards });
  }

  async _onDeletePage(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const name = this._extractPageActionName(rawInput, '(?:delete|remove)');
    const target = this._findPageByName(ctx, name);
    if (!target) {
      const list = (this.container.get('PageRepository').findByProjectId(ctx.project.id) || []).map((p) => p.name).join(', ');
      return this._reply(`Which page should I delete? This site has: ${list}.`, false);
    }
    if (target.isHomepage) {
      return this._reply(`I can't delete the homepage — every site needs one. Delete another page instead.`, false);
    }
    this._pushUndo(ctx);
    const result = this.container.get('PageUseCase').delete({ id: target.id });
    if (!result.success) return this._reply(`Couldn't delete it: ${result.error || 'unknown error'}.`, false);
    // If we deleted the page being viewed, fall back to the homepage.
    const pageState = this.container.get('PageState');
    if (pageState.get && pageState.get() && pageState.get().id === target.id) {
      const pages = this.container.get('PageRepository').findByProjectId(ctx.project.id) || [];
      const home = pages.find((p) => p.isHomepage) || pages[0];
      if (home) pageState.set(home);
    }
    this._render(ctx.project.id);
    return this._reply(`Deleted the ${target.name} page.`, true);
  }

  async _onRenamePage(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const m = String(rawInput || '').match(/\brename\b\s+(?:the\s+)?([a-z0-9][a-z0-9\s-]*?)\s+page\s+to\s+([a-z0-9][a-z0-9\s-]*)/i)
      || String(rawInput || '').match(/\brename\b\s+(?:the\s+)?([a-z0-9][a-z0-9\s-]*?)\s+to\s+([a-z0-9][a-z0-9\s-]*)/i);
    if (!m) {
      return this._reply('Which page, and what should I call it? For example: "rename about to about us".', false);
    }
    const target = this._findPageByName(ctx, m[1].trim());
    if (!target) return this._reply(`I don't see a "${m[1].trim()}" page here.`, false);
    this._pushUndo(ctx);
    const result = this.container.get('PageUseCase').rename({ id: target.id, newName: m[2].trim() });
    if (!result.success) return this._reply(`Couldn't rename it: ${result.error || 'unknown error'}.`, false);
    this._render(ctx.project.id);
    return this._reply(`Renamed to ${m[2].trim()}.`, true);
  }

  // ── Site themes ──────────────────────────────────────────────

  static THEMES = {
    dark:   { name: 'Dark',   styles: { backgroundColor: '#1a202c', color: '#f7fafc' } },
    light:  { name: 'Light',  styles: { backgroundColor: '#ffffff', color: '#1a202c' } },
    warm:   { name: 'Warm',   styles: { backgroundColor: '#fff8f0', color: '#4a2c1a' } },
    ocean:  { name: 'Ocean',  styles: { backgroundColor: '#f0f9ff', color: '#0c4a6e' } },
    forest: { name: 'Forest', styles: { backgroundColor: '#f0fdf4', color: '#14532d' } },
  };

  async _onApplyTheme(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const m = String(rawInput || '').match(/\b(dark|light|warm|ocean|forest)\b/i);
    const key = m ? m[1].toLowerCase() : null;
    const theme = IntentRouter.THEMES[key];
    if (!theme) {
      return this._reply('Which theme? I have Dark, Light, Warm, Ocean, and Forest — e.g. "apply the dark theme".', false);
    }
    this._pushUndo(ctx);
    const pageRepo = this.container.get('PageRepository');
    const pages = pageRepo.findByProjectId(ctx.project.id) || [];
    for (const page of pages) {
      this._updatePageStyles({ project: ctx.project, pageId: page.id }, theme.styles);
    }
    this._render(ctx.project.id);
    return this._reply(`Done — the ${theme.name} theme is live across all ${pages.length} page${pages.length === 1 ? '' : 's'}.`, true);
  }

  async _onRestyle(analysis) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const CSSRenderer = require('../rendering/CSSRenderer');

    // Multi-scope prompts ("make the hero luxurious but keep its buttons
    // playful") are parsed and applied atomically before single-scope.
    const projectRepo0 = this.container.get('ProjectRepository');
    const project0 = (projectRepo0.findById && projectRepo0.findById(ctx.project.id)) || ctx.project;
    const multi = this._parseMultiScope(analysis, project0);
    if (multi && multi.errors) {
      return this._reply(
        `I couldn't apply that: ${multi.errors.join('; ')}. Nothing was changed.`,
        false
      );
    }
    if (multi) {
      return this._applyMultiScope(ctx, project0, multi.ops);
    }

    // Scoped restyle ("make all buttons playful", "clear the button styling")
    // takes precedence; site-wide is the fallback.
    const scope = this._detectScope(analysis, ctx);
    if (scope) {
      return this._onScopedRestyle(ctx, analysis, scope);
    }

    // Directions the NLP extracted, filtered to known design variants.
    let dirs = [...new Set([...(analysis.styles || []), ...(analysis.themes || [])])]
      .map(s => String(s).toLowerCase().trim())
      .filter(s => s && CSSRenderer.VARIANTS[s]);

    if (!dirs.length) {
      const available = Object.keys(CSSRenderer.VARIANTS).join(', ');
      return this._reply(`I can restyle with: ${available}. For example, "make it more playful".`, false);
    }

    const prompt = analysis.normalizedPrompt || '';
    // "switch from luxury to playful" — only the target after "to" applies.
    const fromTo = prompt.match(/\bfrom\b(.+?)\bto\b(.+)$/);
    if (fromTo) {
      const targeted = dirs.filter(d => new RegExp(`\\b${d}\\b`).test(fromTo[2]));
      if (targeted.length) dirs = targeted;
    }

    // Additive ("make it more playful", "keep…") vs replacing ("switch to…").
    // Default is replacing: "make the design minimalist" declares the design.
    const isAdditive = /\b(more|also|add|keep|too|as well)\b/.test(prompt);
    const isReplace = /\b(switch|change|convert|instead|rather)\b/.test(prompt);
    const additive = isAdditive && !isReplace;

    this._pushUndo(ctx);
    const projectRepo = this.container.get('ProjectRepository');
    const project = (projectRepo.findById && projectRepo.findById(ctx.project.id)) || ctx.project;
    const current = Array.isArray(project.designVariants) ? [...project.designVariants] : [];
    project.designVariants = additive
      ? [...new Set([...current, ...dirs])]
      : [...new Set(dirs)];
    if (projectRepo.update) projectRepo.update(project);
    // Keep the in-memory active project in sync so exports read the update.
    const projectState = this.container.get('ProjectState');
    if (projectState.get() && projectState.get().id === project.id) {
      projectState.set(project);
    }
    this._render(ctx.project.id);

    const names = project.designVariants.join(' + ');
    const verb = additive ? 'added' : 'switched to';
    return this._reply(
      `Done — ${verb} the ${names} style. Your pages, content, and images are unchanged.`,
      true
    );
  }

  /**
   * Detect a scoped-restyle target, e.g. "make all buttons playful".
   * Returns a scope key like 'type:button', or null for site-wide.
   * Scoped routing needs an explicit signal: "all"/"every" + type,
   * a "but keep/leave …" constraint, or a clear/remove verb.
   */
  _detectScope(analysis, ctx) {
    const prompt = analysis.normalizedPrompt || '';
    const scopes = (ctx && ctx.project && ctx.project.styleScopes) || [];
    const hasScope = (key) => scopes.some(s => s && s.scope === key);
    const hasKeep = /\b(keep|leave)\b/.test(prompt);
    const hasClear = /\b(clear|remove|reset)\b/.test(prompt);

    // Section scopes: "hero section" is explicit; a bare section name
    // needs a keep/clear signal or an existing scope (sticky).
    const secPhrase = prompt.match(/\b([a-z]+)\s+section\b/);
    if (secPhrase) return `section:${secPhrase[1]}`;
    const SECTION_WORDS = ['hero', 'testimonials', 'gallery', 'features', 'services',
      'story', 'team', 'pricing', 'specials', 'hours', 'location', 'cta'];
    const secName = SECTION_WORDS.find(w => new RegExp(`\\b${w}\\b`).test(prompt));
    if (secName && (hasKeep || hasClear || hasScope(`section:${secName}`))) {
      return `section:${secName}`;
    }

    const typeMap = {
      button: 'button', buttons: 'button',
      card: 'card', cards: 'card',
      heading: 'heading', headings: 'heading',
      headline: 'heading', headlines: 'heading',
      title: 'heading', titles: 'heading',
      paragraph: 'paragraph', paragraphs: 'paragraph',
    };
    const m = prompt.match(/\b(buttons?|cards?|headings?|headlines?|titles?|paragraphs?)\b/);
    if (!m) return null;
    const type = typeMap[m[1]];
    const hasAll = /\b(all|every)\b/.test(prompt);
    if (!hasAll && !hasKeep && !hasClear) {
      // Sticky: once a scope exists for this type, keep routing there.
      if (!hasScope(`type:${type}`)) return null;
    }
    return `type:${type}`;
  }

  async _onScopedRestyle(ctx, analysis, scope) {
    const CSSRenderer = require('../rendering/CSSRenderer');
    const prompt = analysis.normalizedPrompt || '';
    const [kind, rawValue] = scope.split(':');
    const value = rawValue || '';
    const projectRepo = this.container.get('ProjectRepository');
    const project = (projectRepo.findById && projectRepo.findById(ctx.project.id)) || ctx.project;

    // Section scopes resolve against the sections actually present in the
    // project, so the stored key always matches a rendered data-section.
    let resolvedScope = scope;
    let label;
    if (kind === 'section') {
      const available = this._projectSections(project.id);
      const wanted = value.toLowerCase();
      const actual = available.find(s => s === wanted)
        || available.find(s => s.replace(/s$/, '') === wanted.replace(/s$/, ''));
      if (!actual) {
        const list = available.length ? available.join(', ') : 'none';
        return this._reply(
          `This site has no "${value}" section to restyle. Sections here: ${list}.`,
          false
        );
      }
      resolvedScope = `section:${actual}`;
      label = `the ${actual} section`;
    } else {
      label = value === 'button' ? 'the buttons' : `the ${value}s`;
    }

    const scopes = Array.isArray(project.styleScopes)
      ? project.styleScopes
          .filter(s => s && typeof s.scope === 'string')
          .map(s => ({ scope: s.scope, variants: Array.isArray(s.variants) ? [...s.variants] : [] }))
      : [];
    const idx = scopes.findIndex(s => s.scope === resolvedScope);

    const persist = () => {
      project.styleScopes = scopes;
      if (projectRepo.update) projectRepo.update(project);
      const projectState = this.container.get('ProjectState');
      if (projectState.get() && projectState.get().id === project.id) {
        projectState.set(project);
      }
      this._render(ctx.project.id);
    };

    // "clear the button styling" / "clear the hero section styling".
    if (/\b(clear|remove|reset)\b/.test(prompt)) {
      if (idx === -1) {
        const subject = kind === 'section' ? `${label[0].toUpperCase() + label.slice(1)} has` : `${label[0].toUpperCase() + label.slice(1)} have`;
        return this._reply(`${subject} no custom styling to clear.`, false);
      }
      this._pushUndo(ctx);
      scopes.splice(idx, 1);
      persist();
      return this._reply(`Done — cleared the custom styling for ${label}.`, true);
    }

    // Directions the NLP extracted, filtered to known design variants.
    const allDirs = [...new Set([...(analysis.styles || []), ...(analysis.themes || [])])]
      .map(s => String(s).toLowerCase().trim())
      .filter(s => s && CSSRenderer.VARIANTS[s]);
    // "but keep the rest professional" — the keep-clause style goes site-wide.
    let siteDirs = [];
    let scopeDirs = allDirs;
    const keepMatch = prompt.match(/\bbut\b[^.?!]*?\b(keep|leave)\b\s+(?:the\s+)?(?:rest|overall\s+design|site)\s+([a-z]+)/);
    if (keepMatch && allDirs.includes(keepMatch[2])) {
      siteDirs = [keepMatch[2]];
      scopeDirs = allDirs.filter(d => d !== keepMatch[2]);
    }
    // Type scopes need type-level rules; section scopes accept any variant
    // (its site rules are rewritten into the section at render time).
    const cssRenderer = new CSSRenderer();
    const usable = (s) => {
      if (kind === 'section') return true;
      return cssRenderer.getTypeCss(s, value).length > 0;
    };
    const dirs = scopeDirs.filter(usable);
    if (!dirs.length) {
      const available = Object.keys(CSSRenderer.VARIANTS).filter(usable);
      const noun = kind === 'section' ? `the ${value} section` : `${value}s`;
      return this._reply(
        `I can style ${noun} with: ${available.join(', ') || 'nothing yet'}.`,
        false
      );
    }

    this._pushUndo(ctx);
    // Site part (replace — the keep clause declares the site design).
    if (siteDirs.length) {
      project.designVariants = [...new Set(siteDirs)];
    }
    // Scope part: replace by default, merge on additive language.
    const additive = /\b(also|more|too|as well)\b/.test(prompt) && !/\b(switch|change|convert)\b/.test(prompt);
    const entry = { scope: resolvedScope, variants: null };
    if (idx === -1) {
      entry.variants = [...dirs];
      scopes.push(entry);
    } else if (additive) {
      entry.variants = [...new Set([...scopes[idx].variants, ...dirs])];
      scopes[idx] = entry;
    } else {
      entry.variants = [...dirs];
      scopes[idx] = entry;
    }
    persist();
    const parts = [`${label} ${kind === 'section' ? 'is' : 'are'} now ${entry.variants.join(' + ')}`];
    if (siteDirs.length) parts.push(`the rest of the site is ${siteDirs.join(' + ')}`);
    return this._reply(`Done — ${parts.join(', ')}.`, true);
  }

  // ── Multi-scope restyling ────────────────────────────────────
  // One prompt, several explicit target/style pairs:
  //   "Make the hero luxurious but keep its buttons playful."
  //   "Make the hero minimalist, but keep its buttons playful and
  //    the rest professional."
  // Parsed into ops, fully validated, then applied as ONE undoable
  // action. Anything unsupported or ambiguous aborts the whole prompt
  // with nothing applied.

  _clauseStyles(clause) {
    if (!this._clauseExtractors) {
      const StyleExtractor = require('../nlp/stages/StyleExtractor');
      const ThemeExtractor = require('../nlp/stages/ThemeExtractor');
      this._clauseExtractors = [new StyleExtractor(), new ThemeExtractor()];
    }
    const pa = { normalizedPrompt: clause };
    for (const ex of this._clauseExtractors) {
      try { ex.process(pa); } catch { /* extractor failure = no dirs */ }
    }
    const CSSRenderer = require('../rendering/CSSRenderer');
    return [...new Set([...(pa.styles || []), ...(pa.themes || [])])]
      .map(s => String(s).toLowerCase().trim())
      .filter(s => s && CSSRenderer.VARIANTS[s]);
  }

  _clauseTarget(clause, sectionTags) {
    if (/\b(rest|everything else|whole site|entire site)\b/.test(clause)) {
      return { kind: 'site', value: 'site' };
    }
    // Section names: the project's real tags plus common blueprint names,
    // matched singular-insensitively ("testimonials" ~ "testimonial").
    // An explicit "<word> section" phrase is a section target even when
    // the name is unknown — validation reports it instead of ignoring it.
    const secPhrase = clause.match(/\b([a-z]+)\s+section\b/);
    if (secPhrase) return { kind: 'section', value: secPhrase[1] };
    const candidates = new Set([
      'hero', 'testimonials', 'gallery', 'features', 'services', 'story',
      'team', 'pricing', 'specials', 'hours', 'location', 'map', 'cta',
      ...sectionTags,
    ]);
    const words = clause.split(/\s+/);
    for (const w of words) {
      const clean = w.replace(/[^a-z]/g, '');
      if (!clean) continue;
      for (const cand of candidates) {
        if (clean === cand || clean.replace(/s$/, '') === cand.replace(/s$/, '')) {
          return { kind: 'section', value: cand };
        }
      }
    }
    const typeMap = {
      button: 'button', buttons: 'button',
      card: 'card', cards: 'card',
      heading: 'heading', headings: 'heading',
      headline: 'heading', headlines: 'heading',
      title: 'heading', titles: 'heading',
      paragraph: 'paragraph', paragraphs: 'paragraph',
      image: 'image', images: 'image',
    };
    const m = clause.match(/\b(buttons?|cards?|headings?|headlines?|titles?|paragraphs?|images?)\b/);
    if (m) return { kind: 'type', value: typeMap[m[1]] };
    return null;
  }

  _parseMultiScope(analysis, project) {
    const prompt = analysis.normalizedPrompt || '';
    const clauses = prompt.split(/\s+but\s+|\s+and\s+|,\s*/).map(s => s.trim()).filter(Boolean);
    if (clauses.length < 2) return null;

    const sectionTags = this._projectSections(project.id);
    const CSSRenderer = require('../rendering/CSSRenderer');
    const cssRenderer = new CSSRenderer();
    const ops = [];
    const problems = [];
    const targetOnly = [];
    let hasUnchanged = false;

    for (const clause of clauses) {
      // "leave the header unchanged" — a preservation constraint, not an op.
      if (/\b(leave|keep)\b/.test(clause) && /\b(unchanged|as is|as it is|alone)\b/.test(clause)) {
        hasUnchanged = true;
        continue;
      }
      const target = this._clauseTarget(clause, sectionTags);
      // "clear the hero styling" as one clause of a larger prompt.
      if (target && /\b(clear|remove|reset)\b/.test(clause) && /\b(styl\w+|design|theme)\b/.test(clause)) {
        ops.push({ kind: 'clear', target });
        continue;
      }
      if (!target) continue;
      const dirs = this._clauseStyles(clause);
      if (dirs.length) ops.push({ kind: 'assign', target, variants: dirs });
      else targetOnly.push(target);
    }

    const engaged = ops.length >= 2 || (ops.length === 1 && hasUnchanged);
    if (!engaged) return null;

    for (const t of targetOnly) {
      problems.push(`no style was given for the ${t.kind === 'section' ? `${t.value} section` : t.value}`);
    }

    // Resolve + validate every op before anything is applied.
    const resolved = [];
    for (const op of ops) {
      const t = op.target;
      if (t.kind === 'site') {
        if (op.kind === 'assign') resolved.push({ ...op, scopeKey: 'site' });
        continue;
      }
      if (t.kind === 'section') {
        const actual = sectionTags.find(s => s === t.value)
          || sectionTags.find(s => s.replace(/s$/, '') === String(t.value).replace(/s$/, ''));
        if (!actual) {
          problems.push(`this site has no "${t.value}" section (sections: ${sectionTags.join(', ') || 'none'})`);
          continue;
        }
        resolved.push({ ...op, scopeKey: `section:${actual}`, label: `the ${actual} section` });
        continue;
      }
      // type
      const scopeKey = `type:${t.value}`;
      if (op.kind === 'clear') { resolved.push({ ...op, scopeKey, label: `the ${t.value}s` }); continue; }
      const usableDirs = op.variants.filter(v => cssRenderer.getTypeCss(v, t.value).length > 0);
      if (!usableDirs.length) {
        const available = Object.keys(CSSRenderer.VARIANTS)
          .filter(v => cssRenderer.getTypeCss(v, t.value).length > 0);
        problems.push(`I can style ${t.value}s with: ${available.join(', ') || 'nothing yet'}`);
        continue;
      }
      resolved.push({ ...op, variants: usableDirs, scopeKey, label: `the ${t.value}s` });
    }

    if (problems.length) return { errors: problems };

    // Conflicts within one prompt: the LAST instruction for a target wins.
    const byKey = new Map();
    for (const op of resolved) byKey.set(op.scopeKey, op);
    return { ops: [...byKey.values()] };
  }

  _applyMultiScope(ctx, project, ops) {
    this._pushUndo(ctx);
    const projectRepo = this.container.get('ProjectRepository');
    const fresh = (projectRepo.findById && projectRepo.findById(project.id)) || project;
    const scopes = Array.isArray(fresh.styleScopes)
      ? fresh.styleScopes
          .filter(s => s && typeof s.scope === 'string')
          .map(s => ({ scope: s.scope, variants: Array.isArray(s.variants) ? [...s.variants] : [] }))
      : [];
    const parts = [];
    for (const op of ops) {
      if (op.scopeKey === 'site') {
        fresh.designVariants = [...new Set(op.variants)];
        parts.push(`the rest of the site is ${op.variants.join(' + ')}`);
        continue;
      }
      const idx = scopes.findIndex(s => s.scope === op.scopeKey);
      if (op.kind === 'clear') {
        if (idx !== -1) scopes.splice(idx, 1);
        parts.push(`cleared the styling for ${op.label}`);
      } else {
        const entry = { scope: op.scopeKey, variants: [...new Set(op.variants)] };
        if (idx === -1) scopes.push(entry); else scopes[idx] = entry;
        const verb = op.target.kind === 'section' ? 'is' : 'are';
        parts.push(`${op.label} ${verb} now ${entry.variants.join(' + ')}`);
      }
    }
    fresh.styleScopes = scopes;
    if (projectRepo.update) projectRepo.update(fresh);
    const projectState = this.container.get('ProjectState');
    if (projectState.get() && projectState.get().id === fresh.id) {
      projectState.set(fresh);
    }
    this._render(ctx.project.id);
    return this._reply(`Done — ${parts.join(', ')}.`, true);
  }

  /** Distinct section identities present in a project's components. */
  _projectSections(projectId) {    try {
      const pageRepo = this.container.get('PageRepository');
      const compRepo = this.container.get('ComponentRepository');
      const pages = pageRepo.findByProjectId ? pageRepo.findByProjectId(projectId) : [];
      const found = new Set();
      for (const page of pages || []) {
        for (const comp of compRepo.findByPage(projectId, page.id) || []) {
          if (comp && typeof comp.section === 'string' && comp.section.trim()) {
            found.add(comp.section.trim().toLowerCase());
          }
        }
      }
      return [...found];
    } catch {
      return [];
    }
  }

  // ── Components ───────────────────────────────────────────────

  async _onAddComponent(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const text = String(rawInput || '').toLowerCase();
    let type = 'paragraph';
    if (/\bbutton\b/.test(text)) type = 'button';
    else if (/\b(image|photo|picture)\b/.test(text)) type = 'image';
    else if (/\b(heading|headline|title)\b/.test(text)) type = 'heading';
    const sayM = String(rawInput || '').match(/\bsaying\s+["']?([^"']+)["']?$/i)
      || String(rawInput || '').match(/\b(called|with text)\s+["']?([^"']+)["']?$/i);
    const content = (sayM ? (sayM[1] || sayM[2] || '') : '').trim()
      || (type === 'button' ? 'Click me' : type === 'heading' ? 'New heading' : 'New paragraph');
    this._pushUndo(ctx);
    const result = this.container.get('ComponentUseCase').add({
      pageId: ctx.pageId,
      type,
      content,
    });
    if (!result.success) return this._reply(`Couldn't add it: ${result.error || 'unknown error'}.`, false);
    this._render(ctx.project.id);
    return this._reply(`Added a ${type} to the page.`, true);
  }

  async _onEditText(analysis, rawInput) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const newText = extractQuoted(rawInput) || extractAfter(rawInput, /\b(?:to|say|as|into|read)\b/i);
    if (!newText) {
      return this._reply('What should the new text say? For example: "change the headline to Fresh Coffee Daily".', false);
    }
    const { component, type } = this.targets.resolve(analysis.normalizedPrompt, ctx.components, 'heading');
    if (!component) return this._reply(`I couldn't find ${type ? `a ${type}` : 'that'} on this page.`, false);
    this._pushUndo(ctx);
    const useCase = this.container.get('ComponentUseCase');
    const result = useCase.edit({ pageId: ctx.pageId, componentId: component.id, content: newText });
    this._render(ctx.project.id);
    return this._reply(result.success ? 'Updated.' : `Couldn't update it: ${result.error || 'unknown error'}.`, !!result.success);
  }

  async _onEditStyle(analysis) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const styles = parseStyles(analysis.normalizedPrompt);
    if (!Object.keys(styles).length) {
      return this._reply('What look do you want? Try "make the background dark" or "make the headline bigger".', false);
    }
    const prompt = analysis.normalizedPrompt;
    const mentionsComponent = /\b(headline|heading|title|button|paragraph|text|image)\b/.test(prompt);
    const isPageLevel = /\bbackground\b/.test(prompt) && !mentionsComponent;

    this._pushUndo(ctx);
    if (isPageLevel) {
      this._updatePageStyles(ctx, styles);
      this._render(ctx.project.id);
      return this._reply('Done — the page has a fresh look.', true);
    }
    const { component, type } = this.targets.resolve(prompt, ctx.components, 'heading');
    if (!component) return this._reply(`I couldn't find ${type ? `a ${type}` : 'that'} on this page.`, false);
    const useCase = this.container.get('ComponentUseCase');
    const result = useCase.edit({ pageId: ctx.pageId, componentId: component.id, styles });
    this._render(ctx.project.id);
    return this._reply(result.success ? 'Done — fresh look applied.' : `Couldn't apply it: ${result.error || 'unknown error'}.`, !!result.success);
  }

  async _onRemoveSection(analysis) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const sectionKey = this._sectionKey(analysis.normalizedPrompt, true);
    if (sectionKey) {
      const tagged = ctx.components.filter((c) => c.section === sectionKey);
      if (tagged.length) {
        this._pushUndo(ctx);
        const useCase = this.container.get('ComponentUseCase');
        for (const comp of tagged) useCase.delete({ pageId: ctx.pageId, componentId: comp.id });
        this._render(ctx.project.id);
        return this._reply(`Removed the ${humanize(sectionKey)} section.`, true);
      }
    }
    const { component, type } = this.targets.resolve(analysis.normalizedPrompt, ctx.components);
    if (!component) {
      return this._reply(
        type ? `There's no ${type} on this page to remove.` : 'What should I remove? For example: "remove the gallery".',
        false
      );
    }
    this._pushUndo(ctx);
    const useCase = this.container.get('ComponentUseCase');
    const result = useCase.delete({ pageId: ctx.pageId, componentId: component.id });
    this._render(ctx.project.id);
    return this._reply(result.success ? 'Removed.' : `Couldn't remove it: ${result.error || 'unknown error'}.`, !!result.success);
  }

  async _onMoveSection(analysis) {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const { component, type } = this.targets.resolve(analysis.normalizedPrompt, ctx.components);
    if (!component) return this._reply(`I couldn't find ${type ? `a ${type}` : 'that'} to move.`, false);
    const prompt = analysis.normalizedPrompt;
    const direction = /\b(above|top|up|first|before)\b/.test(prompt) ? 'up'
      : /\b(below|bottom|down|last|after)\b/.test(prompt) ? 'down' : null;
    if (!direction) return this._reply('Move it where? Try "move the menu above the about section".', false);
    this._pushUndo(ctx);
    const useCase = this.container.get('ComponentUseCase');
    const result = useCase.move({ pageId: ctx.pageId, componentId: component.id, direction });
    this._render(ctx.project.id);
    return this._reply(result.success ? 'Moved.' : `Couldn't move it: ${result.error || 'unknown error'}.`, !!result.success);
  }

  async _onExport() {
    const ctx = this._context();
    if (!ctx) return this._needSite();
    const exportCommands = require('../../commands/export');
    const result = await exportCommands.zip({});
    return this._reply(
      result.success ? 'Your site is exported as a ZIP — ready to publish anywhere.' : `Export failed: ${result.error || 'unknown error'}.`,
      false,
      result
    );
  }

  async _onUndo() {
    const entry = this.undoStack.pop();
    if (!entry) return this._reply('Nothing to undo yet.', false);
    const current = this._snapshot();
    if (current) this.redoStack.push(current);
    this._restore(entry);
    return this._reply('Undone.', true);
  }

  async _onRedo() {
    const entry = this.redoStack.pop();
    if (!entry) return this._reply('Nothing to redo.', false);
    const current = this._snapshot();
    if (current) this.undoStack.push(current);
    this._restore(entry);
    return this._reply('Redone.', true);
  }

  async _onHelp() {
    return this._reply(
      'Describe the website you want and I will build it — for example "I need a restaurant website". ' +
      'Then refine it in plain words: "add a menu section", "change the headline to Fresh Coffee", ' +
      '"make the background dark", "remove the gallery", "undo that". ' +
      'Say "export as zip" when you want the files.',
      false
    );
  }

  async _onGreeting() {
    return this._reply(
      'Hey! Tell me what kind of website you want — a restaurant, portfolio, store, anything — and I will build it right now.',
      false
    );
  }

  // ── Clarification (never "Unknown command") ──────────────────

  _clarify(analysis) {
    const prompt = (analysis && analysis.normalizedPrompt) || '';
    if (/\b(website|site|webpage)\b/.test(prompt)) {
      return this._reply('What kind of website should I build — a restaurant, bakery, portfolio, store, or something else?', false);
    }
    if (this._context()) {
      return this._reply(
        "I didn't quite catch that. You can ask me to add a section, change text or colors, move or remove things — or say \"export as zip\" when the site is ready.",
        false
      );
    }
    return this._reply('I build websites from plain descriptions. Try: "I need a restaurant website".', false);
  }

  _needSite() {
    return this._reply('There is no website yet. Tell me what to build — for example, "I need a restaurant website".', false);
  }

  // ── Context, snapshots, rendering ────────────────────────────

  _context() {
    const projectState = this.container.get('ProjectState');
    let project = projectState.get();
    if (!project) return null;
    // After a server restart the active project is just an id stub —
    // rehydrate the full record from the repository.
    if (project._restored) {
      const projectRepo = this.container.get('ProjectRepository');
      const full = projectRepo.findById ? projectRepo.findById(project.id) : null;
      if (!full) return null;
      project = full;
      projectState.set(project);
    }
    const pageState = this.container.get('PageState').get();
    const pageRepo = this.container.get('PageRepository');
    let page = pageState && pageState.projectId === project.id ? pageState : null;
    if (!page) {
      page = pageRepo.getHomepage(project.id) || (pageRepo.findByProjectId(project.id) || [])[0];
    }
    if (!page) return { project, pageId: null, components: [] };
    const components = this.container.get('ComponentRepository').findByPage(project.id, page.id) || [];
    return { project, pageId: page.id, page, components };
  }

  _snapshot() {
    const ctx = this._context();
    if (!ctx || !ctx.pageId) return null;
    return {
      projectId: ctx.project.id,
      pageId: ctx.pageId,
      components: JSON.parse(JSON.stringify(ctx.components)),
      pageStyles: JSON.parse(JSON.stringify((ctx.page && ctx.page.styles) || {})),
      designVariants: [...((ctx.project && ctx.project.designVariants) || [])],
      styleScopes: JSON.parse(JSON.stringify((ctx.project && ctx.project.styleScopes) || [])),
    };
  }

  _pushUndo(ctx) {
    const snap = ctx ? {
      projectId: ctx.project.id,
      pageId: ctx.pageId,
      components: JSON.parse(JSON.stringify(ctx.components)),
      pageStyles: JSON.parse(JSON.stringify((ctx.page && ctx.page.styles) || {})),
      designVariants: [...((ctx.project && ctx.project.designVariants) || [])],
      styleScopes: JSON.parse(JSON.stringify((ctx.project && ctx.project.styleScopes) || [])),
    } : this._snapshot();
    if (snap) {
      this.undoStack.push(snap);
      if (this.undoStack.length > 20) this.undoStack.shift();
      this.redoStack = [];
    }
  }

  _restore(snap) {
    if (!snap) return;
    const Component = require('../../domain/models/Component');
    const comps = (snap.components || []).map((c) => (typeof c.toJSON === 'function' ? c : Component.fromJSON(c)));
    this.container.get('ComponentRepository').saveAll(snap.projectId, snap.pageId, comps);
    this._updatePageStyles({ project: { id: snap.projectId }, pageId: snap.pageId }, snap.pageStyles, true);
    // Restore design variants and style scopes so undo/redo of a
    // (scoped) restyle reverts the CSS.
    if (Array.isArray(snap.designVariants) || Array.isArray(snap.styleScopes)) {
      const projectRepo = this.container.get('ProjectRepository');
      const project = (projectRepo.findById && projectRepo.findById(snap.projectId)) || null;
      if (project) {
        if (Array.isArray(snap.designVariants)) project.designVariants = [...snap.designVariants];
        if (Array.isArray(snap.styleScopes)) {
          project.styleScopes = JSON.parse(JSON.stringify(snap.styleScopes));
        }
        if (projectRepo.update) projectRepo.update(project);
        const projectState = this.container.get('ProjectState');
        if (projectState.get() && projectState.get().id === snap.projectId) {
          projectState.set(project);
        }
      }
    }
    this._render(snap.projectId);
  }

  _updatePageStyles(ctx, styles, replace = false) {
    try {
      const pageRepo = this.container.get('PageRepository');
      const page = pageRepo.findById ? pageRepo.findById(ctx.project.id, ctx.pageId) : null;
      const target = page || { id: ctx.pageId, projectId: ctx.project.id };
      target.styles = replace ? { ...styles } : { ...(target.styles || {}), ...styles };
      if (pageRepo.update) pageRepo.update(target);
      else if (pageRepo.save) pageRepo.save(target);
    } catch (e) { console.error('Page styles update failed:', e.message); }
  }

  _render(projectId) {
    try {
      this.container.get('HTMLRenderer').render(projectId);
    } catch (e) { console.error('HTMLRenderer error:', e.message); }
  }

  _sectionKey(prompt, strict = false) {
    for (const [re, key] of SECTION_WORDS) {
      if (re.test(prompt)) return key;
    }
    return strict ? null : 'Features';
  }

  _expandSection(templateKey, project) {
    const dict = this._findSectionDict(templateKey);
    const template = dict || FALLBACK_SECTIONS[templateKey] || [];
    const businessName = (project && (project.name || project.id)) || 'Your Business';
    const items = [];
    for (const item of template) {
      for (const normalized of normalizeTemplateItem(item, businessName)) {
        items.push({ ...normalized, section: templateKey });
      }
    }
    return items;
  }

  _businessOf(project) {
    return this.lastBusiness || 'generic';
  }

  _findSectionDict(templateKey) {
    const ordered = [this._businessOf(), ...SECTION_DICTS.filter((b) => b !== this._businessOf())];
    for (const business of ordered) {
      const dict = loadSectionDict(business);
      if (dict && dict[templateKey]) return dict[templateKey];
    }
    return null;
  }

  _reply(text, refreshPreview, data) {
    const res = responseBuilder.success(text, data && data.data ? data.data : data);
    res.reply = text;
    res.refreshPreview = !!refreshPreview;
    const ctx = this._context();
    res.activeProject = ctx && ctx.project ? ctx.project.name || ctx.project.id : null;
    res.activePage = ctx && ctx.page ? ctx.page.name || ctx.page.id : null;
    return res;
  }
}

// ── Helpers ────────────────────────────────────────────────────

function toHandlerName(intent) {
  return intent.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join('');
}

function capitalize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Page name from "switch page About" (verb + page + name) or
// "go to the about page" / "show me the contact page" (verb + name + page).
function extractSwitchPageName(input) {
  const text = String(input || '');
  let m = text.match(/\bswitch\b(?:\s+to)?\s+page\s+([a-z0-9][a-z0-9 -]*)/i);
  if (m) return capitalize(m[1].trim());
  m = text.match(/\b(?:take me to|go|open|show|view|navigate|switch)\b\s+(?:to\s+)?(?:the\s+)?(?:me\s+)?([a-z0-9][a-z0-9 -]*?)(?:\s+page)?\s*$/i);
  if (m) return capitalize(m[1].trim().replace(/\s+page$/, ''));
  return null;
}

function humanize(camel) {
  return String(camel || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

function extractQuoted(raw) {
  const m = raw.match(/[""](.+?)[""]/);
  return m ? m[1].trim() : null;
}

function extractAfter(raw, re) {
  const m = raw.match(re);
  if (!m) return null;
  const idx = m.index + m[0].length; // m.index, not indexOf: the matched word may appear earlier inside another word ("to" in "button")
  const rest = raw.slice(idx).trim().replace(/[.!?]+$/, '');
  return rest || null;
}

function parseStyles(prompt) {
  const styles = {};
  let colorHex = null;
  for (const [name, hex] of Object.entries(COLOR_WORDS)) {
    if (new RegExp(`\\b${name}\\b`).test(prompt)) { colorHex = hex; break; }
  }
  const isBackground = /\bbackground\b/.test(prompt);
  if (colorHex) styles[isBackground ? 'background-color' : 'color'] = colorHex;
  if (/\bdark(er)?\b/.test(prompt) && !styles['background-color']) styles['background-color'] = '#1a202c';
  if (/\bwarmer\b/.test(prompt) && !styles['background-color']) styles['background-color'] = '#fff7ed';
  if (/\blight(er)?\b/.test(prompt) && !styles['background-color']) styles['background-color'] = '#f7fafc';
  if (/\bbigger\b/.test(prompt)) styles['font-size'] = '2.75rem';
  if (/\bsmaller\b/.test(prompt)) styles['font-size'] = '1rem';
  return styles;
}

const SECTION_DICTS = ['restaurant', 'generic', 'bakery', 'portfolio', 'saas'];

function loadSectionDict(business) {
  try {
    return require(`../../knowledge/components/${business}.js`);
  } catch (e) { return null; }
}

function substitute(text, businessName) {
  return String(text || '').replace(/\{\{\s*business\s*\}\}/gi, businessName);
}

/**
 * Map a knowledge-template item to one or more supported primitives
 * (heading / paragraph / button / image). Unknown widget types like
 * tabs/cards degrade to readable text instead of failing.
 */
function normalizeTemplateItem(item, businessName) {
  const type = (item.type || '').toLowerCase();
  const props = item.properties || {};
  if (['heading', 'paragraph', 'button', 'image'].includes(type)) {
    return [{
      type,
      content: substitute(item.content || item.label || item.asset || '', businessName),
      level: props.level,
      alt: substitute(props.alt || item.asset || '', businessName),
    }];
  }
  if (type === 'tabs' && Array.isArray(props.items)) {
    return [{ type: 'paragraph', content: props.items.join('  •  ') }];
  }
  if (type === 'cards') {
    return [{ type: 'paragraph', content: 'Ask us about our full selection — new items added regularly.' }];
  }
  if (['form', 'gallery', 'table', 'map', 'icons'].includes(type)) {
    return [{
      type,
      content: substitute(item.content || item.label || '', businessName),
      properties: props,
    }];
  }
  return [];
}

module.exports = IntentRouter;
