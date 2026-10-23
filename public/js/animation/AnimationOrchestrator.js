const TIMINGS = {
    assistant: 150,
    progress: [500, 700, 900, 700, 500],
    preview: 250,
    card: 80,
    info: 200,
    badge: 300,
    completion: 400
};

const GENERATION_STEPS = [
    "Creating project...",
    "Creating pages...",
    "Generating components...",
    "Rendering HTML...",
    "Updating preview..."
];

export class AnimationOrchestrator {
    constructor({ uiManager, pageManager, previewManager }) {
        this.uiManager = uiManager;
        this.pageManager = pageManager;
        this.previewManager = previewManager;
    }

    wait(duration) {
        return new Promise((resolve) => window.setTimeout(resolve, duration));
    }

    async showAssistant(message) {
        this.uiManager.addAssistantMessage(message);
        await this.wait(TIMINGS.assistant);
    }

    async showProgress() {
        const progress = this.uiManager.showBuildProgress(GENERATION_STEPS);

        for (let index = 0; index < GENERATION_STEPS.length; index++) {
            this.uiManager.completeBuildProgressStep(progress, index);
            await this.wait(TIMINGS.progress[index]);
        }
    }

    async refreshPreview(shouldRefresh, activePage, previewUrl) {
        if (!shouldRefresh || !activePage) return;

        this.previewManager.setActivePage(activePage, previewUrl);
        await this.previewManager.fadeOut();
        await this.wait(TIMINGS.preview);
        try {
            await this.previewManager.reload();
        } catch (e) {
            console.error(e);
        }
        this.previewManager.fadeIn();
        await this.wait(TIMINGS.preview);
    }

    async animateRecentPages(pages, activePage) {
        this.pageManager.renderPages(pages, activePage, TIMINGS.card);
        await this.wait(Math.max((pages?.length || 0) - 1, 0) * TIMINGS.card + TIMINGS.card);
    }

    async animatePageInfo(pageInfo) {
        if (!pageInfo) return;

        this.pageManager.applyPageInfo(pageInfo, false);
        this.uiManager.animatePageInfo();
        await this.wait(TIMINGS.info);
    }

    async animateActiveBadge() {
        this.uiManager.pulseActiveBadge();
        await this.wait(TIMINGS.badge);
    }

    async playGenerationSequence({ response, activeProject, activePage, pages, page, previewUrl, shouldRefresh }) {
        const isWebsiteGeneration = Boolean(
            response.data?.pagesCount ||
            response.action === "GENERATE_WEBSITE" ||
            response.action === "REGENERATE_WEBSITE" ||
            (response.reply && response.reply.includes("created"))
        );

        // 1. Progress steps (if generation command)
        if (isWebsiteGeneration) {
            await this.showProgress();
        }

        // 2. Refresh Preview (fade out, reload iframe, fade in)
        await this.refreshPreview(shouldRefresh, activePage, previewUrl);

        // 3. Animate Recent Pages
        await this.animateRecentPages(pages, activePage);

        // 4. Animate Page Info
        const pageInfo = activePage ? {
            name: activePage,
            status: `Active (${activeProject || "Project"})`,
            created: page?.createdAt ? new Date(page.createdAt).toLocaleDateString() : "-",
            modified: page?.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "-",
            previewUrl: previewUrl || "/preview"
        } : null;

        await this.animatePageInfo(pageInfo);
        await this.animateActiveBadge();

        // 5. Small completion delay
        await this.wait(TIMINGS.completion);

        // 6. ONLY NOW show final assistant message summary
        await this.showAssistant(response.reply || "Website updated successfully.");
    }
}
