// Sites view: every website on this device as cards. Click to open,
// delete to remove (with confirmation). Uses the LIST_PROJECTS /
// SWITCH_PROJECT / DELETE_PROJECT intents via the SILENT command
// channel, so browsing sites never posts into the dashboard chat.

function escapeHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export class SitesManager {
    constructor({ grid, emptyState, sendCommand, viewManager, uiManager }) {
        this.grid = grid;
        this.emptyState = emptyState;
        this.sendCommand = sendCommand;
        this.viewManager = viewManager;
        this.uiManager = uiManager;
        this.sites = [];
    }

    initialize() {}

    async load() {
        if (!this.sendCommand) return;
        const result = await this.sendCommand("list my sites");
        this.sites = result?.data?.projects || [];
        this.render();
    }

    async confirmDelete(site) {
        if (!window.confirm(`Delete "${site.name}" and all its pages? This can't be undone.`)) return;
        const result = await this.sendCommand(`delete the ${site.name} site`);
        await this.load();
        if (this.sites.some((s) => s.id === site.id)) {
            window.alert(result?.reply || `Couldn't delete "${site.name}".`);
        }
    }

    render() {
        if (!this.grid) return;
        const hasSites = this.sites.length > 0;
        if (this.emptyState) this.emptyState.hidden = hasSites;

        this.grid.innerHTML = this.sites.map((site) => `
            <div class="site-card${site.isActive ? " is-active" : ""}" data-site-id="${escapeHtml(site.id)}">
                <div class="site-card-top">
                    <h3>${escapeHtml(site.name)}</h3>
                    ${site.isActive ? `<span class="badge badge-active">Open</span>` : ""}
                </div>
                <p class="site-meta">${site.pageCount} page${site.pageCount === 1 ? "" : "s"}</p>
                <div class="page-card-actions">
                    <button type="button" class="mini-btn" data-action="open">Open</button>
                    <button type="button" class="mini-btn mini-btn-danger" data-action="delete">Delete</button>
                </div>
            </div>
        `).join("");

        this.grid.querySelectorAll(".site-card").forEach((card) => {
            const site = this.sites.find((s) => String(s.id) === card.dataset.siteId);
            if (!site) return;
            card.querySelector('[data-action="open"]')?.addEventListener("click", () => {
                this.viewManager?.show("dashboardView");
                this.sendCommand(`switch to ${site.name}`).then(() => this.load());
            });
            card.querySelector('[data-action="delete"]')?.addEventListener("click", () => this.confirmDelete(site));
        });
    }
}
