// Templates view: one-click site starters. Each card maps to a blueprint
// the backend already knows; clicking sends the equivalent build command.

function escapeHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const TEMPLATES = [
    {
        key: "restaurant",
        name: "Restaurant",
        description: "Menu, reservations, and a warm appetite-first hero.",
        command: "i need a restaurant website",
        gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
    },
    {
        key: "bakery",
        name: "Bakery",
        description: "Fresh-baked charm with menu highlights and ordering.",
        command: "i need a bakery website",
        gradient: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    },
    {
        key: "portfolio",
        name: "Portfolio",
        description: "Show your work — projects, about, and contact.",
        command: "i need a portfolio website",
        gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    },
    {
        key: "saas",
        name: "SaaS / Startup",
        description: "Features, pricing, and a signup call-to-action.",
        command: "i need a saas website",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
        key: "gym",
        name: "Gym / Fitness",
        description: "Bold and energetic — classes, trainers, join now.",
        command: "i need a gym website",
        gradient: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
    },
    {
        key: "cafe",
        name: "Café",
        description: "Cozy coffee-shop vibes with menu and location.",
        command: "i need a cafe website",
        gradient: "linear-gradient(135deg, #c79081 0%, #dfa579 100%)",
    },
];

export class TemplatesManager {
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
        this.grid.innerHTML = TEMPLATES.map((t) => `
            <button type="button" class="template-card" data-template="${t.key}">
                <div class="template-swatch" style="background:${t.gradient}"></div>
                <h3>${escapeHtml(t.name)}</h3>
                <p>${escapeHtml(t.description)}</p>
                <span class="template-cta">Use this template →</span>
            </button>
        `).join("");

        this.grid.querySelectorAll(".template-card").forEach((card) => {
            card.addEventListener("click", () => {
                const t = TEMPLATES.find((x) => x.key === card.dataset.template);
                if (!t) return;
                // Jump back to the dashboard so the build progress + preview
                // are visible, then send the build command.
                this.viewManager?.show("dashboardView");
                this.sendCommand?.(t.command);
            });
        });
    }
}
