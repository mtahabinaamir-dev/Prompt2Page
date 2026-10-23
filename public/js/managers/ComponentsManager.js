// Components view: click-to-add palette. Each tile sends the matching
// ADD_COMPONENT chat command for the currently open page.

function escapeHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const COMPONENTS = [
    { key: "heading",   name: "Heading",   icon: "H",  command: "add a heading",   blurb: "A bold section title." },
    { key: "paragraph", name: "Paragraph", icon: "¶",  command: "add a paragraph", blurb: "Body text block." },
    { key: "button",    name: "Button",    icon: "▣",  command: "add a button",    blurb: "Call-to-action button." },
    { key: "image",     name: "Image",     icon: "🖼", command: "add an image",    blurb: "Photo placeholder." },
];

export class ComponentsManager {
    constructor({ grid, sendCommand, viewManager }) {
        this.grid = grid;
        this.sendCommand = sendCommand;
        this.viewManager = viewManager;
    }

    initialize() {
        this.render();
    }

    render() {
        if (!this.grid) return;
        this.grid.innerHTML = COMPONENTS.map((c) => `
            <button type="button" class="component-card" data-component="${c.key}">
                <div class="component-icon">${escapeHtml(c.icon)}</div>
                <h3>${escapeHtml(c.name)}</h3>
                <p>${escapeHtml(c.blurb)}</p>
                <span class="component-cta">Add to page →</span>
            </button>
        `).join("");

        this.grid.querySelectorAll(".component-card").forEach((card) => {
            card.addEventListener("click", () => {
                const c = COMPONENTS.find((x) => x.key === card.dataset.component);
                if (!c) return;
                this.viewManager?.show("dashboardView");
                this.sendCommand?.(c.command);
            });
        });
    }
}
