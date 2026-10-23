class CSSRenderer {

    // Design variants: named CSS override blocks applied on top of the base
    // stylesheet when the user's prompt carries a matching style/theme
    // direction (e.g. "luxury", "cinematic", "playful"). Keys are the
    // canonical style/theme names from the NLP dictionaries. Later blocks
    // win on conflicts; unknown names are ignored.
    static VARIANTS = {

        luxury: `
body { font-family: Georgia, 'Times New Roman', serif; background-color: #faf8f3; color: #2b2620; }
h1, h2, h3, h4, h5, h6, .heading { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; letter-spacing: 0.03em; color: #1a1611; }
h1, .heading.h1 { font-size: 3.5rem; }
.site-section { padding: 5rem 0; }
.navbar { background: #1a1611; }
.navbar .brand { font-family: Georgia, serif; letter-spacing: 0.18em; text-transform: uppercase; font-size: 1.1rem; }
.btn { background-color: #b8860b; border-radius: 0; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.85rem; padding: 1rem 2.25rem; }
.btn:hover { background-color: #9a7209; }
.card { border: 1px solid #e8e0d0; border-radius: 0; box-shadow: none; }
.footer { background: #1a1611; }`,

        cinematic: `
body { background-color: #0d0d0f; color: #e8e6e1; }
h1, h2, h3, h4, h5, h6, .heading { color: #ffffff; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
h1, .heading.h1 { font-size: 4rem; line-height: 1.05; }
p, .paragraph { color: #b8b5ae; }
.site-section { border-bottom: 1px solid #26262a; padding: 4.5rem 0; }
.navbar { background: #000000; }
.btn { background-color: #c1121f; border-radius: 0; letter-spacing: 0.12em; text-transform: uppercase; }
.btn:hover { background-color: #9a0e18; }
.card { background: #161618; border-color: #2a2a2e; }
.card-title { color: #ffffff; }
.card-text { color: #b8b5ae; }
.footer { background: #000000; }`,

        playful: {
            css: `
body { background-color: #fff9f0; }
h1, h2, h3, h4, h5, h6, .heading { color: #d9480f; font-weight: 800; letter-spacing: -0.01em; }
p, .paragraph { color: #5c4a3a; }
.btn { background-color: #7048e8; border-radius: 999px; padding: 0.9rem 2rem; }
.btn:hover { background-color: #5f3dc4; }
.card { border-radius: 1.25rem; border: 2px solid #ffd43b; }
.social-icon { border-radius: 999px; border-width: 2px; border-color: #7048e8; color: #7048e8; }
.gallery-img { border-radius: 1rem; }`,
            types: {
                button: `.btn { background-color: #7048e8; border-radius: 999px; padding: 0.9rem 2rem; }
.btn:hover { background-color: #5f3dc4; }`,
            },
        },

        minimalist: `
body { background-color: #ffffff; color: #444444; }
.site-section { padding: 6rem 0; border-bottom: none; }
h1, h2, h3, h4, h5, h6, .heading { font-weight: 300; letter-spacing: -0.02em; color: #111111; }
p, .paragraph { color: #666666; }
.navbar { background: #ffffff; box-shadow: none; border-bottom: 1px solid #eeeeee; }
.navbar .brand { color: #111111; }
.navbar .nav-links a { color: #666666; }
.navbar .nav-links a:hover { color: #111111; }
.btn { background-color: #111111; border-radius: 0; }
.btn:hover { background-color: #333333; }
.card { border: none; box-shadow: none; background: #fafafa; border-radius: 0; }
.footer { background: #ffffff; border-top: 1px solid #eeeeee; }`,

        museum: `
body { background-color: #f4f1ea; font-family: Georgia, 'Times New Roman', serif; color: #3a352c; }
.container { max-width: 880px; }
.site-section { padding: 5rem 0; text-align: center; border-bottom: 1px solid #ddd6c2; }
h1, h2, h3, h4, h5, h6, .heading { font-family: Georgia, serif; font-weight: 400; color: #2a251c; text-align: center; }
p, .paragraph { text-align: center; max-width: 36rem; margin-left: auto; margin-right: auto; color: #5a5344; }
.navbar .brand { font-family: Georgia, serif; letter-spacing: 0.2em; text-transform: uppercase; font-size: 1rem; }
.btn { background-color: #2a251c; border-radius: 0; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.85rem; }`,

        retro: `
body { background-color: #f5efe0; color: #4a3f30; font-family: Georgia, 'Times New Roman', serif; }
h1, h2, h3, h4, h5, h6, .heading { color: #3d2f1f; font-family: Georgia, serif; }
p, .paragraph { color: #6b5d43; }
.navbar { background: #3d2f1f; }
.btn { background-color: #8b5a2b; border-radius: 0.25rem; }
.btn:hover { background-color: #74491f; }
.card { background: #faf6ea; border-color: #d8c9a3; }
.footer { background: #3d2f1f; }`,

        rustic: `
body { background-color: #faf5ec; color: #4c3a28; }
h1, h2, h3, h4, h5, h6, .heading { color: #5d3a1a; font-family: Georgia, 'Times New Roman', serif; }
p, .paragraph { color: #6e5840; }
.btn { background-color: #a0522d; }
.btn:hover { background-color: #7e3f22; }
.card { background: #fffdf8; border-color: #e0cfa8; }
.site-section { border-bottom: 1px solid #e0cfa8; }`,

        colorful: `
h1, h2, h3, h4, h5, h6, .heading { color: #d6336c; }
.btn { background: linear-gradient(135deg, #7048e8, #d6336c); border: none; border-radius: 999px; }
.btn:hover { background: linear-gradient(135deg, #5f3dc4, #b82a5c); }
.card:nth-child(odd) { border-top: 4px solid #ffd43b; }
.card:nth-child(even) { border-top: 4px solid #3bc9db; }
.social-icon { border-color: #7048e8; color: #7048e8; }
.navbar .brand { color: #ffd43b; }`,

        warm: `
body { background-color: #fff8f0; color: #5c4a3a; }
h1, h2, h3, h4, h5, h6, .heading { color: #7c4a21; }
p, .paragraph { color: #7a6552; }
.btn { background-color: #e8590c; }
.btn:hover { background-color: #c94a08; }
.site-section { border-bottom: 1px solid #f0e0cc; }`,

        oversized: `
h1, .heading.h1 { font-size: 4.5rem; line-height: 1.05; letter-spacing: -0.02em; }
h2, .heading.h2 { font-size: 3rem; }
h3, .heading.h3 { font-size: 2rem; }
.site-section { padding: 5rem 0; }`,

        professional: `
body { background-color: #f8fafc; color: #334155; }
h1, h2, h3, h4, h5, h6, .heading { color: #0f172a; font-weight: 700; letter-spacing: -0.01em; }
p, .paragraph { color: #475569; }
.navbar { background: #0f172a; }
.btn { background-color: #1d4ed8; border-radius: 0.375rem; }
.btn:hover { background-color: #1e40af; }
.card { border: 1px solid #e2e8f0; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.footer { background: #0f172a; }`,

    };

    getVariantStyles(variantNames) {

        if (!Array.isArray(variantNames)) return "";

        const seen = new Set();
        const blocks = [];

        for (const name of variantNames) {

            const key = String(name || "").toLowerCase().trim();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            const variant = CSSRenderer.VARIANTS[key];
            // Variants may be a plain CSS string or { css, types }.
            const css = typeof variant === 'string' ? variant : variant && variant.css;
            if (css) {
                blocks.push(`/* Design variant: ${key} */\n${css.trim()}`);
            }

        }

        return blocks.join("\n\n");

    }

    /**
     * CSS rules for one component type within one variant, e.g.
     * getTypeCss('playful', 'button') → the playful .btn rules.
     * Returns '' when the variant or type is unknown.
     */
    /**
     * Parse simple `selector-list { decls }` rules.
     *
     * CONSTRAINT (tested in tests/css-baseline.test.js): variant CSS uses
     * only simple rules — no at-rules (@media/@supports blocks are skipped
     * by the at-guard below), no braces or semicolons inside quoted
     * strings, no comma-bearing functional selectors (:not(.a, .b)).
     * This is a deliberate simplification, not a general CSS parser; if a
     * future variant needs those constructs, upgrade this parser first.
     */
    _parseRules(css) {
        const rules = [];
        for (const chunk of String(css || "").replace(/\/\*[\s\S]*?\*\//g, "").split("}")) {
            const brace = chunk.indexOf("{");
            if (brace === -1) continue;
            const selectorText = chunk.slice(0, brace).trim();
            const decls = chunk.slice(brace + 1).trim();
            if (!selectorText || !decls) continue;
            if (selectorText.startsWith("@")) continue; // at-rules unsupported (see constraint)
            rules.push({
                selectors: selectorText.split(",").map(s => s.trim()).filter(Boolean),
                decls,
            });
        }
        return rules;
    }

    /**
     * Derive a component type's rules from a variant's full CSS: only
     * rules whose selectors ALL target the type's class at a class
     * boundary (`.btn`, `.btn:hover`, `.btn .icon` — but NOT
     * `.btn-primary` or `.card .btn` for buttons). Mixed selector lists
     * are excluded, so one type's extraction never leaks another's.
     */
    _deriveTypeRules(css, typeName) {
        // Heading/paragraph: element selectors are REWRITTEN to the
        // component classes. A rule qualifies only if EVERY selector is a
        // heading/paragraph form, and `hN` becomes `.heading.hN` (heading
        // components render as <hN class="heading hN">) while `p` becomes
        // `.paragraph`. The derived rules therefore hit components — and
        // the widget titles that share those classes, exactly as the
        // site-wide rules' class branches do — but never raw headings or
        // paragraphs elsewhere (card titles, nav, footer).
        if (typeName === 'heading' || typeName === 'paragraph') {
            const isSel = typeName === 'heading'
                ? (s) => /^h[1-6]$/.test(s) || s === '.heading' || /^\.heading\.h[1-6]$/.test(s)
                : (s) => s === 'p' || s === '.paragraph';
            const rewrite = typeName === 'heading'
                ? (s) => (/^h[1-6]$/.test(s) ? `.heading.${s}` : s)
                : (s) => (s === 'p' ? '.paragraph' : s);
            return this._parseRules(css)
                .filter(r => r.selectors.length && r.selectors.every(isSel))
                .map(r => `${[...new Set(r.selectors.map(rewrite))].join(", ")} { ${r.decls} }`)
                .join("\n");
        }
        const cls = typeName === 'button' ? 'btn' : typeName === 'card' ? 'card' : null;
        if (!cls) return "";
        const boundary = new RegExp(`^\\.${cls}(?=$|[\\s.:#[>+~])`);
        return this._parseRules(css)
            .filter(r => r.selectors.length && r.selectors.every(s => boundary.test(s)))
            .map(r => `${r.selectors.join(", ")} { ${r.decls} }`)
            .join("\n");
    }

    getTypeCss(variantName, typeName) {
        const key = String(variantName || "").toLowerCase().trim();
        const type = String(typeName || "").toLowerCase().trim();
        const variant = CSSRenderer.VARIANTS[key];
        if (!variant) return "";
        // Explicitly authored type rules win.
        if (typeof variant === 'object' && variant.types && typeof variant.types[type] === 'string') {
            return variant.types[type].trim();
        }
        // Otherwise derive from the variant's own rules (see _deriveTypeRules).
        const css = this._variantCss(key);
        if (!css) return "";
        return this._deriveTypeRules(css, type);
    }

    /** Full site-wide CSS string for a variant (string or {css} form). */
    _variantCss(variantName) {
        const key = String(variantName || "").toLowerCase().trim();
        const variant = CSSRenderer.VARIANTS[key];
        if (!variant) return "";
        const css = typeof variant === 'string' ? variant : variant.css;
        return typeof css === 'string' ? css.trim() : "";
    }

    /**
     * Rewrite variant CSS so every rule applies inside one section:
     * `body`/`.site-section` map to the section element itself, other
     * selectors get the [data-section] prefix, and page-chrome selectors
     * (.navbar/.footer) are dropped — they never live inside a section.
     */
    _scopeCssToSection(css, section) {
        const self = `[data-section="${section}"]`;
        const rules = [];
        for (const rule of this._parseRules(css)) {
            const scoped = [];
            for (const sel of rule.selectors) {
                if (sel === "body" || sel === ".site-section") { scoped.push(self); continue; }
                if (/^\.(navbar|footer)\b/.test(sel)) continue;
                scoped.push(`${self} ${sel}`);
            }
            if (scoped.length) rules.push(`${scoped.join(", ")} { ${rule.decls} }`);
        }
        return rules.join("\n");
    }

    /** A variant's rules scoped to one section, e.g. luxury in the hero. */
    getSectionCss(variantName, section) {
        const name = String(section || "").toLowerCase().trim();
        if (!name) return "";
        const css = this._variantCss(variantName);
        if (!css) return "";
        return this._scopeCssToSection(css, name);
    }

    /**
     * Scoped variant CSS for styleScopes entries:
     * [{ scope: 'type:button', variants: ['playful'] },
     *  { scope: 'section:hero', variants: ['luxury'] }].
     * Emitted after site-wide variants. Order: type blocks, then section
     * blocks, then type-inside-section blocks — a type scope keeps winning
     * inside a scoped section (equal specificity, later wins).
     */
    getScopedStyles(styleScopes) {
        if (!Array.isArray(styleScopes)) return "";
        const typeEntries = [];
        const sectionEntries = [];
        for (const entry of styleScopes) {
            if (!entry || typeof entry.scope !== 'string') continue;
            const [kind, value] = entry.scope.split(':');
            if (!value) continue;
            if (kind === 'type') typeEntries.push([entry, value]);
            else if (kind === 'section') sectionEntries.push([entry, value]);
        }
        const blocks = [];
        for (const [entry, type] of typeEntries) {
            for (const name of entry.variants || []) {
                const css = this.getTypeCss(name, type);
                if (css) blocks.push(`/* Scoped: ${entry.scope} × ${String(name).toLowerCase()} */\n${css}`);
            }
        }
        for (const [entry, section] of sectionEntries) {
            for (const name of entry.variants || []) {
                const css = this.getSectionCss(name, section);
                if (css) blocks.push(`/* Scoped: ${entry.scope} × ${String(name).toLowerCase()} */\n${css}`);
            }
        }
        // Cross rules: type scopes re-asserted inside scoped sections.
        for (const [, section] of sectionEntries) {
            for (const [entry, type] of typeEntries) {
                for (const name of entry.variants || []) {
                    const css = this.getTypeCss(name, type);
                    if (!css) continue;
                    const inner = this._scopeCssToSection(css, section);
                    if (inner) blocks.push(`/* Scoped: section:${section} × ${entry.scope} × ${String(name).toLowerCase()} */\n${inner}`);
                }
            }
        }
        return blocks.join("\n\n");
    }

    getDefaultStyles() {

        return `
/* Base Styles */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #2d3748; background-color: #f7fafc; min-height: 100vh; display: flex; flex-direction: column; }
.main-content { flex: 1; padding-top: 2rem; padding-bottom: 2rem; }

/* Container */
.container { width: 100%; max-width: 1140px; margin-left: auto; margin-right: auto; padding-left: 1.5rem; padding-right: 1.5rem; }

/* Section */
.site-section { padding: 3rem 0; border-bottom: 1px solid #e2e8f0; }

/* Navbar */
.navbar { background: #1a202c; color: #ffffff; padding: 1rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.nav-wrapper { display: flex; justify-content: space-between; align-items: center; }
.navbar .brand { font-size: 1.5rem; font-weight: 700; color: #ffffff; text-decoration: none; }
.navbar .nav-links { display: flex; list-style: none; gap: 1.5rem; align-items: center; }
.navbar .nav-links a { color: #cbd5e0; text-decoration: none; font-weight: 500; transition: color 0.2s; }
.navbar .nav-links a:hover { color: #ffffff; }

/* Typography */
h1, h2, h3, h4, h5, h6, .heading { color: #1a202c; font-weight: 700; line-height: 1.25; margin-top: 1.5rem; margin-bottom: 1rem; }
h1, .heading.h1 { font-size: 2.5rem; }
h2, .heading.h2 { font-size: 2rem; }
h3, .heading.h3 { font-size: 1.5rem; }

p, .paragraph { font-size: 1.125rem; color: #4a5568; margin-bottom: 1.25rem; }

/* Button */
.btn { display: inline-block; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 600; text-align: center; text-decoration: none; color: #ffffff; background-color: #3182ce; border: none; border-radius: 0.375rem; cursor: pointer; transition: background-color 0.2s, transform 0.1s; margin-top: 0.5rem; margin-bottom: 1rem; }
.btn:hover { background-color: #2b6cb0; }
.btn:active { transform: scale(0.98); }

/* Form */
.site-form { max-width: 560px; margin: 1.5rem 0; }
.form-field { margin-bottom: 1rem; }
.form-field label { display: block; font-weight: 600; margin-bottom: 0.35rem; }
.form-field input, .form-field textarea { width: 100%; padding: 0.65rem 0.8rem; border: 1px solid #cbd5e0; border-radius: 0.375rem; font: inherit; }
.form-field input:focus, .form-field textarea:focus { outline: 2px solid #3182ce; border-color: #3182ce; }

/* Gallery */
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin: 1.5rem 0; }
.gallery-img { width: 100%; height: 180px; object-fit: cover; border-radius: 0.5rem; }

/* Table */
.site-table { width: 100%; border-collapse: collapse; margin: 1rem 0 1.5rem; }
.site-table td { padding: 0.6rem 0.8rem; border-bottom: 1px solid #e2e8f0; }
.site-table tr:last-child td { border-bottom: none; }

/* Map */
.map-embed { margin: 1.5rem 0; }
.map-embed iframe { width: 100%; height: 320px; border: 0; border-radius: 0.5rem; }
.map-label { color: #718096; font-size: 0.9rem; margin-top: 0.5rem; }

/* Social icons */
.social-icons { display: flex; gap: 0.75rem; margin: 1.5rem 0; flex-wrap: wrap; }
.social-icon { display: inline-block; padding: 0.5rem 1rem; border: 1px solid #cbd5e0; border-radius: 999px; color: #2d3748; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
.social-icon:hover { background: #edf2f7; }

/* Cards */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
.cards-carousel { display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 0.75rem; margin: 1.5rem 0; }
.cards-carousel .card { flex: 0 0 280px; scroll-snap-align: start; }
.card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.25rem; }
.card-title { font-size: 1.125rem; margin: 0 0 0.5rem; color: #1a202c; }
.card-text { font-size: 1rem; color: #4a5568; margin: 0; }
.card-placeholder { border-style: dashed; background: #f7fafc; }

/* Tabs (pure-CSS radio-group pattern, no JavaScript) */
.tabs { margin: 1.5rem 0; }
.tab-input { position: absolute; opacity: 0; pointer-events: none; }
.tab-label { display: inline-block; padding: 0.6rem 1.25rem; margin: 0 0.25rem 0 0; border: 1px solid #e2e8f0; border-bottom: none; border-radius: 0.5rem 0.5rem 0 0; background: #edf2f7; color: #4a5568; font-weight: 600; cursor: pointer; }
.tab-input:checked + .tab-label { background: #ffffff; color: #1a202c; }
.tab-input:focus-visible + .tab-label { outline: 2px solid #3182ce; outline-offset: 2px; }
.tab-panel { display: none; border: 1px solid #e2e8f0; border-radius: 0 0.5rem 0.5rem 0.5rem; padding: 1.25rem; background: #ffffff; }
.tab-input:checked + .tab-label + .tab-panel { display: block; }

/* Responsive */
@media (max-width: 768px) {  .container { padding-left: 1rem; padding-right: 1rem; }
  .nav-wrapper { flex-direction: column; gap: 0.75rem; }
  .navbar .nav-links { flex-wrap: wrap; justify-content: center; gap: 0.75rem 1rem; }
  h1, .heading.h1 { font-size: 1.9rem; }
  h2, .heading.h2 { font-size: 1.6rem; }
  h3, .heading.h3 { font-size: 1.3rem; }
  p, .paragraph { font-size: 1rem; }
  .site-section { padding: 2rem 0; }
  .btn { width: 100%; padding: 0.9rem 1.5rem; }
  .img-placeholder { min-height: 160px; }
  .cards-grid { grid-template-columns: 1fr; }
  .tab-label { padding: 0.5rem 0.9rem; font-size: 0.9rem; }
}
@media (max-width: 480px) {
  h1, .heading.h1 { font-size: 1.6rem; }
  .navbar .brand { font-size: 1.25rem; }
}

/* Image */
.img-responsive { max-width: 100%; height: auto; display: block; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 1.5rem 0; }
.img-placeholder { display: flex; align-items: center; justify-content: center; min-height: 220px; margin: 1.5rem 0; border-radius: 0.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: rgba(255,255,255,0.92); font-size: 0.95rem; text-align: center; padding: 2rem; }

/* Footer */
.footer { background: #1a202c; color: #a0aec0; padding: 2rem 0; text-align: center; margin-top: auto; }
.footer p { margin-bottom: 0; font-size: 0.875rem; color: #a0aec0; }
`.trim();

    }

    // Per-project design variation: a seed picks an accent palette, a
    // heading font, and a corner radius from curated sets, so sites built
    // from identical prompts don't come out identical. The block sits
    // between the base styles and the named variants — explicit user
    // styling (variants, scopes, themes) always wins over it.
    static VARIATION_ACCENTS = [
        null, // default blue #3182ce
        ['#0f766e', '#115e59'], // teal
        ['#15803d', '#166534'], // emerald
        ['#6d28d9', '#5b21b6'], // violet
        ['#be123c', '#9f1239'], // rose
        ['#b45309', '#92400e'], // amber
        ['#4338ca', '#3730a3'], // indigo
        ['#0e7490', '#155e75'], // cyan
        ['#a21caf', '#86198f'], // fuchsia
        ['#c2410c', '#9a3412'], // burnt orange
    ];

    static VARIATION_FONTS = [
        null, // default stack
        "Georgia, 'Times New Roman', serif",
        "'Trebuchet MS', 'Segoe UI', sans-serif",
        "Verdana, Geneva, sans-serif",
    ];

    static VARIATION_RADII = [null, '0.75rem', '1.25rem'];

    getVariationCss(seed) {
        if (!Number.isInteger(seed) || seed < 0) return "";
        const accents = CSSRenderer.VARIATION_ACCENTS;
        const fonts = CSSRenderer.VARIATION_FONTS;
        const radii = CSSRenderer.VARIATION_RADII;
        const accent = accents[seed % accents.length];
        const font = fonts[Math.floor(seed / accents.length) % fonts.length];
        const radius = radii[Math.floor(seed / (accents.length * fonts.length)) % radii.length];
        const rules = [];
        if (accent) {
            rules.push(`.btn { background-color: ${accent[0]}; }`);
            rules.push(`.btn:hover { background-color: ${accent[1]}; }`);
            rules.push(`.form-field input:focus, .form-field textarea:focus { outline: 2px solid ${accent[0]}; border-color: ${accent[0]}; }`);
        }
        if (font) {
            rules.push(`h1, h2, h3, h4, h5, h6, .heading { font-family: ${font}; }`);
        }
        if (radius) {
            rules.push(`.btn, .card { border-radius: ${radius}; }`);
        }
        return rules.join("\n");
    }

    render(customStyles = "", variantNames = [], styleScopes = [], designSeed = null) {

        const base = this.getDefaultStyles();
        const parts = [base];

        const variationCss = this.getVariationCss(designSeed);
        if (variationCss) parts.push(`/* Design Variation */\n${variationCss}`);

        const variantCss = this.getVariantStyles(variantNames);
        if (variantCss) parts.push(`/* Design Variants */\n${variantCss}`);

        const scopedCss = this.getScopedStyles(styleScopes);
        if (scopedCss) parts.push(`/* Scoped Variants */\n${scopedCss}`);

        if (customStyles && customStyles.trim()) {

            parts.push(`/* Custom Styles */\n${customStyles}`);

        }

        return parts.join("\n\n").trim();

    }

}

module.exports = CSSRenderer;
