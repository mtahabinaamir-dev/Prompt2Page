// Commands view: a clickable cheat-sheet. Every card sends its command
// through the normal chat pipeline, so the conversation stays in sync.

function escapeHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const GROUPS = [
    {
        title: "Build",
        commands: [
            "i need a restaurant website",
            "i need a portfolio website for a designer",
            "rebuild it",
        ],
    },
    {
        title: "Edit text",
        commands: [
            "change the headline to Welcome to our shop",
            "add a paragraph about our story",
        ],
    },
    {
        title: "Style",
        commands: [
            "make the background dark",
            "make the headline bigger",
            "apply the ocean theme",
        ],
    },
    {
        title: "Pages",
        commands: [
            "add a contact page",
            "switch page about",
            "rename about to about us",
            "list pages",
        ],
    },
    {
        title: "Images",
        commands: [
            "list assets",
            "use logo.png as the hero image",
        ],
    },
    {
        title: "Finish",
        commands: [
            "undo that",
            "export as zip",
        ],
    },
];

export class CommandsManager {
    constructor({ container, sendCommand, viewManager }) {
        this.container = container;
        this.sendCommand = sendCommand;
        this.viewManager = viewManager;
    }

    initialize() {
        this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = GROUPS.map((g) => `
            <div class="command-group">
                <h3>${escapeHtml(g.title)}</h3>
                <div class="command-cards">
                    ${g.commands.map((c) => `
                        <button type="button" class="command-card" data-command="${escapeHtml(c)}">
                            <span class="command-text">"${escapeHtml(c)}"</span>
                            <span class="command-run">Run →</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `).join("");

        this.container.querySelectorAll(".command-card").forEach((card) => {
            card.addEventListener("click", () => {
                this.viewManager?.show("dashboardView");
                this.sendCommand?.(card.dataset.command);
            });
        });
    }
}
