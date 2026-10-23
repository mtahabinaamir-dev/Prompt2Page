const fs = require("fs");
const path = require("path");
const CSSRenderer = require("./CSSRenderer");
const { escapeHtml, normalizeHeadingLevel, renderInlineStyles } = require("../utils/escapeHtml");
const { renderCards, renderTabs, renderForm, renderGallery, renderTable, renderMap, renderIcons } = require("../utils/widgets");
const { groupBySection } = require("../utils/sections");

class HTMLRenderer {

    renderComponent(comp, { project, pages = [] } = {}) {

        if (!comp) return "";

        if (typeof comp.toHTML === "function") {

            return comp.toHTML();

        }

        const type = (comp.type || "paragraph").toLowerCase();
        const content = escapeHtml(comp.content || "");
        const level = normalizeHeadingLevel(comp.level || "h1");
        const alt = escapeHtml(comp.alt || "Image");
        const styleAttr = renderInlineStyles(comp.styles);

        switch (type) {

            case "heading":
                return `<${level} class="heading ${level}"${styleAttr}>${content}</${level}>`;

            case "paragraph":
                return `<p class="paragraph"${styleAttr}>${content}</p>`;

            case "button":
                return `<button class="btn"${styleAttr}>${content}</button>`;

            case "image": {
                const rawSrc = comp.content || "";
                const src = escapeHtml(rawSrc);
                // A src that isn't a URL, absolute path, or real filename is a
                // template placeholder token (e.g. "hero-image"). Render an
                // honest styled placeholder instead of a broken <img>.
                const looksReal = /^(https?:|\/|data:)/i.test(rawSrc) || /\.[a-z0-9]{2,5}([?#]|$)/i.test(rawSrc);
                if (!looksReal) {
                    const label = escapeHtml(comp.alt && comp.alt !== "Image" ? comp.alt : "Your photo here");
                    return `<div class="img-placeholder"${styleAttr}><span>${label} — upload one in the Media Library</span></div>`;
                }
                return `<img src="${src}" alt="${alt}" class="img-responsive"${styleAttr} />`;
            }

            case "form":
                return renderForm(comp);

            case "gallery":
                return renderGallery(comp);

            case "table":
                return renderTable(comp);

            case "map":
                return renderMap(comp);

            case "icons":
                return renderIcons(comp);

            case "cards":
                return renderCards(comp);

            case "tabs":
                return renderTabs(comp);

            case "section": {
                const sectionChildren = Array.isArray(comp.children)
                    ? comp.children.map(c => this.renderComponent(c, { project, pages })).join("\n")
                    : content;
                const ds = comp.section ? ` data-section="${escapeHtml(comp.section)}"` : "";
                return `<section class="site-section"${ds}>\n${sectionChildren}\n</section>`;
            }

            case "container":
                const containerChildren = Array.isArray(comp.children)
                    ? comp.children.map(c => this.renderComponent(c, { project, pages })).join("\n")
                    : content;
                return `<div class="container">\n${containerChildren}\n</div>`;

            case "navbar":
                const projectName = escapeHtml(project ? (project.name || project.id) : "Website");
                const navLinks = pages.map(p => {
                    const pageId = p.id || (p.name ? p.name.toLowerCase() : "page");
                    const href = (p.isHomepage || pageId === "home") ? "index.html" : `${pageId}.html`;
                    return `<li><a href="${escapeHtml(href)}">${escapeHtml(p.name || pageId)}</a></li>`;
                }).join("\n");

                return `<nav class="navbar">
    <div class="container nav-wrapper">
        <a href="index.html" class="brand">${projectName}</a>
        <ul class="nav-links">
${navLinks}
        </ul>
    </div>
</nav>`;

            case "footer":
                const footerTitle = escapeHtml(project ? (project.name || project.id) : "Website");
                const year = new Date().getFullYear();
                return `<footer class="footer">
    <div class="container footer-wrapper">
        <p>&copy; ${year} ${footerTitle}. All rights reserved.</p>
    </div>
</footer>`;

            default:
                return `<div class="component-${type}">${content}</div>`;

        }

    }

    renderComponents(components = [], context = {}) {

        if (!Array.isArray(components)) return "";

        // Group consecutive components that share a section identity into a
        // <section data-section="…"> wrapper so scoped styles can target the
        // section. Components without a section (legacy projects, ad-hoc
        // additions) render unwrapped, exactly as before.
        return groupBySection(components).map(group => {
            const inner = group.items.map(c => this.renderComponent(c, context)).join("\n");
            return group.section
                ? `<section class="site-section" data-section="${escapeHtml(group.section)}">\n${inner}\n</section>`
                : inner;
        }).join("\n");

    }

    renderPage({ project, page, pages = [], components = [], styles = "" } = {}) {

        const pageName = page ? (page.name || page.id) : "Page";
        const projName = project ? (project.name || project.id) : "Website";
        const pageTitle = page && page.seoTitle ? page.seoTitle : `${pageName} - ${projName}`;
        const bodyContent = this.renderComponents(components, { project, pages });
        const bodyStyleAttr = renderInlineStyles(page && page.styles);

        // SEO: description from the first paragraph, favicon from the brand initial.
        const firstPara = components.find(c => (c.type || "").toLowerCase() === "paragraph" && c.content);
        const metaDesc = escapeHtml(String(page && page.seoDescription ? page.seoDescription : (firstPara ? firstPara.content : `${projName} - ${pageName}`)).slice(0, 160));
        const initial = escapeHtml((projName || "W").trim().charAt(0).toUpperCase());
        const favicon = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#3182ce"/><text x="32" y="44" font-size="36" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold">${initial}</text></svg>`)}`;

        const hasNavbar = components.some(c => (c.type || "").toLowerCase() === "navbar");
        const hasFooter = components.some(c => (c.type || "").toLowerCase() === "footer");

        const navbarHTML = hasNavbar ? "" : this.renderComponent({ type: "navbar" }, { project, pages });
        const footerHTML = hasFooter ? "" : this.renderComponent({ type: "footer" }, { project, pages });

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${metaDesc}">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${metaDesc}">
    <link rel="icon" href="${favicon}">
    <title>${escapeHtml(pageTitle)}</title>
    ${styles ? `<style>\n${styles}\n</style>` : '<link rel="stylesheet" href="../../styles.css">'}
</head>
<body${bodyStyleAttr}>
${navbarHTML}
    <main class="main-content container">
${bodyContent}
    </main>
${footerHTML}
</body>
</html>`;

    }

    renderRootIndexHtml(homepageSlug = "home") {

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=pages/${homepageSlug}/index.html">
    <title>Redirecting...</title>
</head>
<body>
    <p>Redirecting to <a href="pages/${homepageSlug}/index.html">Home Page</a>...</p>
</body>
</html>`;

    }

    renderProject(project, pages = [], componentsMap = {}) {

        const pagesHTML = {};
        const homepage = pages.find(p => p.isHomepage || p.id === "home") || pages[0];
        const homepageSlug = homepage ? (homepage.id || "home") : "home";

        for (const page of pages) {

            const components = componentsMap[page.id] || page.components || [];

            pagesHTML[page.id] = this.renderPage({
                project,
                page,
                pages,
                components
            });

        }

        pagesHTML["index.html"] = this.renderRootIndexHtml(homepageSlug);

        return pagesHTML;

    }

    render(projectId) {

        const projectDir = path.join(process.cwd(), "generated", "projects", projectId);

        if (!fs.existsSync(projectDir)) {

            return false;

        }

        const pagesDir = path.join(projectDir, "pages");
        const pages = [];
        const componentsMap = {};

        let project = { id: projectId, name: projectId };

        const projectJsonPath = path.join(projectDir, "project.json");

        if (fs.existsSync(projectJsonPath)) {

            try {

                project = JSON.parse(fs.readFileSync(projectJsonPath, "utf8"));

            } catch (e) {}

        }

        if (fs.existsSync(pagesDir)) {

            const files = fs.readdirSync(pagesDir);

            for (const file of files) {

                const fullPath = path.join(pagesDir, file);

                try {

                    const stat = fs.statSync(fullPath);

                    if (stat.isFile() && file.endsWith(".json")) {

                        const pageId = file.replace(/\.json$/, "");
                        const pageMeta = JSON.parse(fs.readFileSync(fullPath, "utf8"));

                        if (!pages.some(p => p.id === pageMeta.id)) {
                            pages.push(pageMeta);
                        }

                    } else if (stat.isDirectory()) {

                        const pageId = file;

                        // Prefer the .json metadata file when it exists — the
                        // directory entry may sort first and must not shadow it.
                        const metaPath = path.join(pagesDir, `${pageId}.json`);
                        let dirPage = { id: pageId, name: pageId, isHomepage: pageId === "home" };

                        if (fs.existsSync(metaPath)) {

                            try {

                                dirPage = JSON.parse(fs.readFileSync(metaPath, "utf8"));

                            } catch (e) {}

                        }

                        const idx = pages.findIndex(p => p.id === pageId);

                        if (idx < 0) {

                            pages.push(dirPage);

                        } else if (dirPage.seoTitle || dirPage.seoDescription || dirPage.styles) {

                            pages[idx] = dirPage;

                        }

                        const compPath = path.join(pagesDir, pageId, "components.json");

                        if (fs.existsSync(compPath)) {

                            try {

                                componentsMap[pageId] = JSON.parse(fs.readFileSync(compPath, "utf8"));

                            } catch (e) {

                                componentsMap[pageId] = [];

                            }

                        }

                    }

                } catch (err) {}

            }

        }

        const cssRenderer = new CSSRenderer();
        const styles = cssRenderer.render("", (project && project.designVariants) || [], (project && project.styleScopes) || [], (project && project.designSeed) ?? null);

        // 1. Write styles.css at generated/projects/{project}/styles.css
        const cssPath = path.join(projectDir, "styles.css");
        fs.writeFileSync(cssPath, styles, "utf8");

        // 2. Render each page and write to generated/projects/{project}/pages/{page}/index.html
        const homepage = pages.find(p => p.isHomepage || p.id === "home") || pages[0];
        const homepageSlug = homepage ? (homepage.id || "home") : "home";

        for (const page of pages) {

            const comps = componentsMap[page.id] || [];
            const pageHtml = this.renderPage({
                project,
                page,
                pages,
                components: comps,
                styles
            });

            const pageFolder = path.join(pagesDir, page.id);

            if (!fs.existsSync(pageFolder)) {

                try {
                    fs.mkdirSync(pageFolder, { recursive: true });
                } catch (err) {}

            }

            fs.writeFileSync(path.join(pageFolder, "index.html"), pageHtml, "utf8");

        }

        // 3. Write root index.html at generated/projects/{project}/index.html
        const rootIndexHtml = this.renderRootIndexHtml(homepageSlug);
        fs.writeFileSync(path.join(projectDir, "index.html"), rootIndexHtml, "utf8");

        return true;

    }

    renderProjectFromDirectory(projectDirPath) {

        const projectId = path.basename(projectDirPath);

        return this.render(projectId);

    }

}

module.exports = HTMLRenderer;
