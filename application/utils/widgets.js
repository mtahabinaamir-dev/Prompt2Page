/**
 * Shared widget renderers for composite component types.
 *
 * Used by both HTMLRenderer.renderComponent (live preview / static render)
 * and Component.toHTML (cached page.html consumed by exports), so both
 * outputs agree. All user-supplied text is escaped via the existing
 * security utilities in escapeHtml.js.
 */
const { escapeHtml, renderInlineStyles } = require('./escapeHtml');

let tabSeq = 0;

function humanize(value) {
    return String(value || '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Render a cards component.
 * properties.items (optional): array of strings or {title, text} objects.
 * properties.source (optional): collection name used for placeholder labels.
 * properties.layout: "grid" (default) or "carousel" (horizontal scroll strip).
 * Missing/invalid items fall back to clearly-labeled placeholders — the
 * section is never dropped and never crashes.
 */
function renderCards(comp) {
    const props = (comp && comp.properties) || {};
    const layout = props.layout === 'carousel' ? 'carousel' : 'grid';
    const rawTitle = (comp && comp.content) || '';
    const title = escapeHtml(rawTitle);
    const styleAttr = renderInlineStyles(comp && comp.styles);
    const rawItems = Array.isArray(props.items) ? props.items : [];

    let cardsHtml;
    if (rawItems.length) {
        cardsHtml = rawItems
            .map((item) => {
                const isObj = item !== null && typeof item === 'object';
                const text = escapeHtml(String((isObj && item.title) || (!isObj ? item : '') || ''));
                const sub =
                    isObj && item.text ? `<p class="card-text">${escapeHtml(String(item.text))}</p>` : '';
                return `<article class="card"><h4 class="card-title">${text || 'Card'}</h4>${sub}</article>`;
            })
            .join('\n');
    } else {
        // Blueprint sources name a collection but carry no items — render
        // placeholders instead of removing the section.
        const sourceName = humanize(props.source || 'items');
        cardsHtml = [1, 2, 3]
            .map(
                (n) =>
                    `<article class="card card-placeholder"><h4 class="card-title">${escapeHtml(
                        `${sourceName} ${n}`
                    )}</h4>` + `<p class="card-text">New items coming soon.</p></article>`
            )
            .join('\n');
    }

    const cls = layout === 'carousel' ? 'cards-carousel' : 'cards-grid';
    return `${title ? `<h3 class="heading">${title}</h3>` : ''}<div class="${cls}"${styleAttr}>\n${cardsHtml}\n</div>`;
}

/**
 * Render a tabs component.
 * properties.items: array of tab labels (strings). Panel content is not part
 * of the blueprint schema, so panels carry a clearly-labeled placeholder.
 * Pure-CSS radio-group pattern: keyboard accessible, no JavaScript.
 */
function renderTabs(comp) {
    const props = (comp && comp.properties) || {};
    const items = Array.isArray(props.items)
        ? props.items.filter((i) => i !== null && i !== undefined && String(i).trim() !== '')
        : [];
    const rawTitle = (comp && comp.content) || '';
    const title = escapeHtml(rawTitle);
    const styleAttr = renderInlineStyles(comp && comp.styles);
    const heading = title ? `<h3 class="heading">${title}</h3>` : '';

    if (!items.length) {
        return `${heading}<p class="paragraph"${styleAttr}>No tabs configured yet.</p>`;
    }

    const groupId = `tabs-${++tabSeq}`;
    const tabsHtml = items
        .map((raw, i) => {
            const name = escapeHtml(String(raw));
            const inputId = `${groupId}-${i}`;
            return (
                `<input class="tab-input" type="radio" name="${groupId}" id="${inputId}"${
                    i === 0 ? ' checked' : ''
                }>` +
                `<label class="tab-label" for="${inputId}">${name}</label>` +
                `<div class="tab-panel"><p class="paragraph">${name} — content coming soon.</p></div>`
            );
        })
        .join('\n');

    return (
        `${heading}<div class="tabs"${styleAttr} role="radiogroup" ` +
        `aria-label="${escapeHtml(rawTitle || 'Tabs')}">\n${tabsHtml}\n</div>`
    );
}

/**
 * Render a form component. Fields come from properties.fields; types are
 * inferred from the field name. Static sites can't process forms server-side,
 * so mailto: is the honest fallback.
 */
function renderForm(comp) {
    const props = (comp && comp.properties) || {};
    const fields = Array.isArray(props.fields) ? props.fields : ['name', 'email', 'message'];
    const fieldLabels = {
        name: 'Name',
        email: 'Email',
        message: 'Message',
        date: 'Date',
        guests: 'Guests',
        phone: 'Phone',
    };
    const styleAttr = renderInlineStyles(comp && comp.styles);
    const inputs = fields
        .map((f) => {
            const key = String(f).toLowerCase();
            const label = escapeHtml(fieldLabels[key] || key.charAt(0).toUpperCase() + key.slice(1));
            if (key === 'message') {
                return `<div class="form-field"><label>${label}<textarea name="${escapeHtml(
                    key
                )}" rows="4" required></textarea></label></div>`;
            }
            const type = key === 'email' ? 'email' : key === 'date' ? 'date' : key === 'guests' ? 'number' : 'text';
            return `<div class="form-field"><label>${label}<input type="${type}" name="${escapeHtml(
                key
            )}" required></label></div>`;
        })
        .join('\n');
    return (
        `<form class="site-form" action="mailto:" method="post" enctype="text/plain"${styleAttr}>\n${inputs}\n` +
        `<div class="form-field"><button type="submit" class="btn">Send</button></div>\n</form>`
    );
}

/**
 * Render a gallery component. Without images, renders the honest styled
 * placeholder instead of a broken grid.
 */
function renderGallery(comp) {
    const props = (comp && comp.properties) || {};
    const images = Array.isArray(props.images) ? props.images : [];
    const styleAttr = renderInlineStyles(comp && comp.styles);
    if (!images.length) {
        return `<div class="img-placeholder"${styleAttr}><span>Gallery — upload photos in the Media Library</span></div>`;
    }
    const items = images
        .map((src) => `<img src="${escapeHtml(String(src))}" alt="Gallery photo" class="gallery-img" loading="lazy" />`)
        .join('\n');
    return `<div class="gallery-grid"${styleAttr}>\n${items}\n</div>`;
}

/**
 * Render a table component. Rows are strings with cells split on "|".
 */
function renderTable(comp) {
    const props = (comp && comp.properties) || {};
    const rows = Array.isArray(props.rows) ? props.rows : [];
    const rawTitle = (comp && comp.content) || props.title || '';
    const title = escapeHtml(rawTitle);
    const styleAttr = renderInlineStyles(comp && comp.styles);
    const body = rows
        .map((r) => {
            const cells = String(r)
                .split('|')
                .map((c) => `<td>${escapeHtml(c.trim())}</td>`)
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('\n');
    return `${
        title ? `<h3 class="heading">${title}</h3>` : ''
    }<table class="site-table"${styleAttr}>\n<tbody>\n${body}\n</tbody>\n</table>`;
}

/**
 * Render a map component. OpenStreetMap embed needs no API key; the address
 * text doubles as the accessible label.
 */
function renderMap(comp) {
    const rawLabel = (comp && comp.content) || (comp && comp.alt) || 'Find us here';
    const label = escapeHtml(rawLabel);
    const styleAttr = renderInlineStyles(comp && comp.styles);
    return (
        `<div class="map-embed"${styleAttr}><iframe title="${label}" ` +
        `src="https://www.openstreetmap.org/export/embed.html?bbox=-0.13%2C51.49%2C-0.09%2C51.53&amp;layer=mapnik" ` +
        `loading="lazy"></iframe><p class="map-label">${label}</p></div>`
    );
}

/**
 * Render a social icons component.
 */
function renderIcons(comp) {
    const props = (comp && comp.properties) || {};
    const platforms = Array.isArray(props.platforms) ? props.platforms : ['instagram', 'facebook', 'twitter'];
    const styleAttr = renderInlineStyles(comp && comp.styles);
    const links = platforms
        .map((p) => {
            const name = escapeHtml(String(p));
            const label = name.charAt(0).toUpperCase() + name.slice(1);
            return `<a href="#" class="social-icon" aria-label="${label}">${label}</a>`;
        })
        .join('\n');
    return `<div class="social-icons"${styleAttr}>\n${links}\n</div>`;
}

module.exports = {
    renderCards,
    renderTabs,
    renderForm,
    renderGallery,
    renderTable,
    renderMap,
    renderIcons,
};
