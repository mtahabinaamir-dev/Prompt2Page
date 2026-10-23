class Component {

    constructor({
        id = null,
        pageId = null,
        projectId = null,
        type = null,
        content = "",
        level = "h2",
        alt = "",
        order = 0,
        styles = {},
        section = null,
        properties = {},
        createdAt = null,
        updatedAt = null
    } = {}) {

        this.id = id;
        this.pageId = pageId;
        this.projectId = projectId;
        this.type = type;
        this.content = content;
        this.level = level || "h2";
        this.alt = alt || "";
        this.order = order || 0;
        this.styles = styles && typeof styles === "object" ? styles : {};
        this.section = section || null;
        this.properties = properties && typeof properties === "object" ? properties : {};
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();

    }

    validate() {

        const errors = [];
        const allowedTypes = ["heading", "paragraph", "button", "image", "form", "gallery", "table", "map", "icons", "cards", "tabs"];

        if (!this.type || !allowedTypes.includes(this.type)) {

            errors.push(`Invalid component type. Must be one of: ${allowedTypes.join(", ")}`);

        }

        if (this.type === "image" && (!this.content || typeof this.content !== "string")) {

            errors.push("Image component requires a valid image src in content");

        }

        return {
            isValid: errors.length === 0,
            errors
        };

    }

    toHTML() {

        const { escapeHtml, normalizeHeadingLevel, renderInlineStyles } = require("../../application/utils/escapeHtml");
        const { renderCards, renderTabs, renderForm, renderGallery, renderTable, renderMap, renderIcons } = require("../../application/utils/widgets");
        const styleAttr = renderInlineStyles(this.styles);
        const safeId = escapeHtml(this.id || "");

        switch (this.type) {

            case "heading": {
                const tag = normalizeHeadingLevel(this.level);
                return `<${tag} id="${safeId}" class="heading ${tag}"${styleAttr}>${escapeHtml(this.content || "")}</${tag}>`;
            }

            case "paragraph": {
                return `<p id="${safeId}" class="paragraph"${styleAttr}>${escapeHtml(this.content || "")}</p>`;
            }

            case "button": {
                return `<button id="${safeId}" class="btn"${styleAttr}>${escapeHtml(this.content || "Click Me")}</button>`;
            }

            case "image": {
                return `<img id="${safeId}" src="${escapeHtml(this.content || "")}" alt="${escapeHtml(this.alt || "")}"${styleAttr} />`;
            }

            case "cards":
                return renderCards(this);

            case "tabs":
                return renderTabs(this);

            case "form":
                return renderForm(this);

            case "gallery":
                return renderGallery(this);

            case "table":
                return renderTable(this);

            case "map":
                return renderMap(this);

            case "icons":
                return renderIcons(this);

            default:
                return `<!-- unknown component: ${escapeHtml(this.type)} -->`;

        }

    }

    toJSON() {

        return {
            id: this.id,
            pageId: this.pageId,
            projectId: this.projectId,
            type: this.type,
            content: this.content,
            level: this.level,
            alt: this.alt,
            order: this.order,
            styles: this.styles,
            section: this.section,
            properties: this.properties,
            createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt,
            updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : this.updatedAt
        };

    }

    static fromJSON(data) {

        return new Component({
            id: data.id,
            pageId: data.pageId,
            projectId: data.projectId,
            type: data.type,
            content: data.content,
            level: data.level,
            alt: data.alt,
            order: data.order,
            styles: data.styles,
            section: data.section,
            properties: data.properties,
            createdAt: data.createdAt ? new Date(data.createdAt) : null,
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : null
        });

    }

}

module.exports = Component;
