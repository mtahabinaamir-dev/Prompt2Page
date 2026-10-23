const EXAMPLE_COMMANDS = [
    "Create a restaurant website",
    "Create a SaaS landing page",
    "Create a portfolio website",
    "Add a pricing page",
    "Add testimonials",
    "Make the navbar sticky",
    "Change the buttons to green",
    "Replace the hero image",
    "Create a contact page",
    "Export to GitHub Pages"
];

const EXAMPLE_ROTATION_MS = 3500;
const EXAMPLE_FADE_MS = 160;

export class CommandManager {
    constructor({ apiService, uiManager, pageManager, previewManager, animationOrchestrator, mediaLibraryManager, commandInput, sendButton, clearButton }) {
        this.apiService = apiService;
        this.uiManager = uiManager;
        this.pageManager = pageManager;
        this.previewManager = previewManager;
        this.animationOrchestrator = animationOrchestrator;
        this.mediaLibraryManager = mediaLibraryManager;
        this.commandInput = commandInput;
        this.sendButton = sendButton;
        this.clearButton = clearButton;
        this.exampleIndex = 0;
        this.exampleRotationTimer = null;
        this.exampleFadeTimer = null;
    }

    initialize() {
        this.initializeEvents();
        this.initializeExampleRotation();
    }

    initializeEvents() {
        this.sendButton.addEventListener("click", () => {
            this.handleCommand();
        });

        this.clearButton.addEventListener("click", () => {
            this.handleClearChat();
        });

        this.commandInput.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;

            event.preventDefault();
            this.handleCommand();
        });

        this.commandInput.addEventListener("focus", () => {
            this.stopExampleRotation();
        });

        this.commandInput.addEventListener("input", () => {
            if (this.commandInput.value) {
                this.stopExampleRotation();
            }
        });

        this.commandInput.addEventListener("blur", () => {
            this.startExampleRotation();
        });
    }

    initializeExampleRotation() {
        this.commandInput.placeholder = EXAMPLE_COMMANDS[this.exampleIndex];
        this.startExampleRotation();
    }

    canRotateExamples() {
        return !this.commandInput.value && document.activeElement !== this.commandInput;
    }

    startExampleRotation() {
        if (!this.canRotateExamples() || this.exampleRotationTimer) return;

        this.exampleRotationTimer = window.setInterval(() => {
            this.rotateExample();
        }, EXAMPLE_ROTATION_MS);
    }

    stopExampleRotation() {
        if (this.exampleRotationTimer) {
            window.clearInterval(this.exampleRotationTimer);
            this.exampleRotationTimer = null;
        }

        if (this.exampleFadeTimer) {
            window.clearTimeout(this.exampleFadeTimer);
            this.exampleFadeTimer = null;
        }

        this.commandInput.classList.remove("is-placeholder-fading");
    }

    rotateExample() {
        if (!this.canRotateExamples()) {
            this.stopExampleRotation();
            return;
        }

        this.commandInput.classList.add("is-placeholder-fading");

        this.exampleFadeTimer = window.setTimeout(() => {
            if (!this.canRotateExamples()) return;

            this.exampleIndex = (this.exampleIndex + 1) % EXAMPLE_COMMANDS.length;
            this.commandInput.placeholder = EXAMPLE_COMMANDS[this.exampleIndex];
            this.commandInput.classList.remove("is-placeholder-fading");
            this.exampleFadeTimer = null;
        }, EXAMPLE_FADE_MS);
    }

    handleClearChat() {
        if (!this.uiManager.clearChat()) return;

        this.commandInput.focus();
    }

    queueCommand(command) {
        this.stopExampleRotation();
        this.commandInput.value = command;
        this.handleCommand();
    }

    // Silent command channel for view managers (My Sites / Pages): runs the
    // command and refreshes preview + dashboard metadata WITHOUT posting to
    // the chat, stuffing the input, or stealing focus on completion. The
    // refresh chain is decorative, so it is NOT awaited — data returns to
    // the caller immediately and the views feel instant.
    async runSilent(command) {
        try {
            const data = await this.apiService.sendCommand(command);

            if (data && data.success) {
                (async () => {
                    try {
                        const state = await this.apiService.getApplicationState();

                        const activeProject = state.activeProject || data.activeProject;
                        const activePage = state.activePage || data.activePage;
                        const pages = state.pages || data.pages || [];
                        const previewUrl = state.previewUrl || data.previewUrl || (activeProject && activePage ? `/generated/projects/${activeProject}/pages/${activePage}/index.html` : "/preview");
                        const shouldRefresh = data.refreshPreview || data.data?.refreshPreview || Boolean(activePage);

                        await this.animationOrchestrator.refreshPreview(shouldRefresh, activePage, previewUrl);
                        await this.animationOrchestrator.animateRecentPages(pages, activePage);

                        const pageInfo = activePage ? {
                            name: activePage,
                            status: `Active (${activeProject || "Project"})`,
                            created: state.page?.createdAt ? new Date(state.page.createdAt).toLocaleDateString() : "-",
                            modified: state.page?.updatedAt ? new Date(state.page.updatedAt).toLocaleDateString() : "-",
                            previewUrl: previewUrl || "/preview"
                        } : null;
                        await this.animationOrchestrator.animatePageInfo(pageInfo);

                        if (this.mediaLibraryManager && typeof this.mediaLibraryManager.refresh === "function") {
                            this.mediaLibraryManager.refresh();
                        }

                        window.dispatchEvent(new CustomEvent("p2p:previewUpdated"));
                    } catch { /* decorative refresh only */ }
                })();
            }

            return data;
        } catch {
            return null;
        }
    }

    async handleCommand() {
        const message = this.commandInput.value.trim();

        if (message === "") return;

        this.uiManager.addUserMessage(message);
        this.uiManager.clearCommandInput();
        this.uiManager.setInputLoading(true);
        this.uiManager.showThinkingState();

        try {
            const data = await this.apiService.sendCommand(message);

            this.uiManager.hideThinkingState();
            this.uiManager.setInputLoading(false);

            if (data.success) {

                const state = await this.apiService.getApplicationState();

                const activeProject = state.activeProject || data.activeProject;
                const activePage = state.activePage || data.activePage;
                const pages = state.pages || data.pages || [];
                const previewUrl = state.previewUrl || data.previewUrl || (activeProject && activePage ? `/generated/projects/${activeProject}/pages/${activePage}/index.html` : "/preview");
                const shouldRefresh = data.refreshPreview || data.data?.refreshPreview || Boolean(activePage);

                // Play generation/update sequence & show final summary message at the end
                await this.animationOrchestrator.playGenerationSequence({
                    response: data,
                    activeProject,
                    activePage,
                    pages,
                    page: state.page,
                    previewUrl,
                    shouldRefresh
                });

                if (this.mediaLibraryManager && typeof this.mediaLibraryManager.refresh === "function") {
                    this.mediaLibraryManager.refresh();
                }

                window.dispatchEvent(new CustomEvent("p2p:previewUpdated"));

            } else {
                this.uiManager.addAssistantMessage(data.reply || "Something went wrong. Please try again.");
            }
        }
        catch (error) {
            this.uiManager.hideThinkingState();
            this.uiManager.setInputLoading(false);
            this.uiManager.addAssistantMessage("Unable to connect to Prompt2Page.");
        }
    }

}
