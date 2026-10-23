// Pages view: lists every page in the active site as cards. Click a card
// to switch to it; rename/delete/add run through the SILENT command
// channel, so managing pages never posts into the dashboard chat.

function escapeHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export class PagesManager {
    constructor({ grid, emptyState, addButton, sendCommand, uiManager }) {
        this.grid = grid;
        this.emptyState = emptyState;
        this.addButton = addButton;
        this.sendCommand = sendCommand;
        this.uiManager = uiManager;
        this.pages = [];
    }

    initialize() {
        this.addButton?.addEventListener("click", () => this.promptAdd());
    }

    async load() {
        if (!this.sendCommand) return;
        const result = await this.sendCommand("list pages");
        const pages = result?.data?.pages || [];
        this.pages = pages;
        this.render();
    }

    promptAdd() {
        const name = window.prompt("Name for the new page:");
        if (name && name.trim()) {
            this.sendCommand(`add a ${name.trim()} page`).then(() => this.load());
        }
    }

    promptRename(page) {
        const name = window.prompt(`Rename "${page.name}" to:`, page.name);
        if (name && name.trim() && name.trim() !== page.name) {
            this.sendCommand(`rename ${page.name} to ${name.trim()}`).then(() => this.load());
        }
    }

    confirmDelete(page) {
        if (page.isHomepage) {
            window.alert("The homepage can't be deleted — every site needs one.");
            return;
        }
        if (window.confirm(`Delete the "${page.name}" page? This can't be undone.`)) {
            this.sendCommand(`delete the ${page.name} page`).then(() => this.load());
        }
    }

    render() {
        if (!this.grid) return;
        const hasPages = this.pages.length > 0;
        if (this.emptyState) this.emptyState.hidden = hasPages;

        this.grid.innerHTML = this.pages.map((page) => `
            <div class="page-card${page.isActive ? " is-active" : ""}" data-page-id="${escapeHtml(page.id)}">
                <div class="page-card-top">
                    <h3>${escapeHtml(page.name)}</h3>
                    <div class="page-badges">
                        ${page.isHomepage ? `<span class="badge">Home</span>` : ""}
                        ${page.isActive ? `<span class="badge badge-active">Viewing</span>` : ""}
                    </div>
                </div>
                <div class="page-card-actions">
                    <button type="button" class="mini-btn" data-action="open">Open</button>
                    <button type="button" class="mini-btn" data-action="rename">Rename</button>
                    <button type="button" class="mini-btn mini-btn-danger" data-action="delete">Delete</button>
                </div>
            </div>
        `).join("");

        this.grid.querySelectorAll(".page-card").forEach((card) => {
            const page = this.pages.find((p) => String(p.id) === card.dataset.pageId);
            if (!page) return;
            card.querySelector('[data-action="open"]')?.addEventListener("click", () => {
                this.sendCommand(`switch page ${page.name}`).then(() => this.load());
            });
            card.querySelector('[data-action="rename"]')?.addEventListener("click", () => this.promptRename(page));
            card.querySelector('[data-action="delete"]')?.addEventListener("click", () => this.confirmDelete(page));
        });
    }
}
