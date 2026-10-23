// Style Manager view: site-wide theme presets. One click applies the
// theme to every page via the APPLY_THEME chat intent.

function escapeHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const THEMES = [
    { key: "dark",   name: "Dark",   bg: "#1a202c", fg: "#f7fafc", blurb: "Sleek and modern." },
    { key: "light",  name: "Light",  bg: "#ffffff", fg: "#1a202c", blurb: "Clean and classic." },
    { key: "warm",   name: "Warm",   bg: "#fff8f0", fg: "#4a2c1a", blurb: "Cozy bakery tones." },
    { key: "ocean",  name: "Ocean",  bg: "#f0f9ff", fg: "#0c4a6e", blurb: "Fresh and airy blue." },
    { key: "forest", name: "Forest", bg: "#f0fdf4", fg: "#14532d", blurb: "Calm natural green." },
];

export class StyleManagerView {
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
        this.grid.innerHTML = THEMES.map((t) => `
            <button type="button" class="theme-card" data-theme="${t.key}">
                <div class="theme-preview" style="background:${t.bg};color:${t.fg}">
                    <span class="theme-preview-heading" style="color:${t.fg}">Aa</span>
                    <span class="theme-preview-text" style="color:${t.fg}">The quick brown fox</span>
                </div>
                <h3>${escapeHtml(t.name)}</h3>
                <p>${escapeHtml(t.blurb)}</p>
            </button>
        `).join("");

        this.grid.querySelectorAll(".theme-card").forEach((card) => {
            card.addEventListener("click", () => {
                this.viewManager?.show("dashboardView");
                this.sendCommand?.(`apply the ${card.dataset.theme} theme`);
            });
        });
    }
}
