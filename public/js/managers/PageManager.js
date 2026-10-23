export class PageManager {
    constructor({ apiService, uiManager, previewManager, openPageButton, exportManager }) {
        this.apiService = apiService;
        this.uiManager = uiManager;
        this.previewManager = previewManager;
        this.openPageButton = openPageButton;
        this.exportManager = exportManager;
        this.activePage = null;
    }

    initialize(onSelectPage) {
        this.onSelectPage = onSelectPage;

        this.openPageButton?.addEventListener("click", () => {
            this.openActivePage();
        });
    }

    async loadState() {
        this.uiManager.showRecentPagesLoading();

        try {

            const data = await this.apiService.getApplicationState();

            const pages = data?.pages || [];
            const activePage = data?.activePage
                || (data?.activeProject
                    ? pages.find((page) => page.toLowerCase() === "home") || pages[0] || null
                    : null);

            this.renderPages(pages, activePage);

            if (activePage) {
                const page = data?.page || {};

                this.applyPageInfo({
                    name: activePage,
                    status: `Active (${data.activeProject || "Project"})`,
                    created: page.createdAt ? new Date(page.createdAt).toLocaleDateString() : "-",
                    modified: page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "-",
                    previewUrl: data?.previewUrl || "/preview"
                });
                await this.previewManager.refresh();
            }
            else {
                this.clearActivePage();
            }

        }
        catch (error) {

            this.renderPages([], null);
            this.clearActivePage();

        }
    }

    applyPageInfo(pageInfo, animate = true) {
        if (!pageInfo) return;

        this.activePage = pageInfo.name;
        this.previewUrl = "/preview";
        this.uiManager.updatePageInfo(pageInfo, animate);
        this.previewManager.setActivePage(pageInfo.name);
    }

    clearActivePage() {
        this.activePage = null;
        this.previewUrl = null;
        this.uiManager.clearPageInfo();
        this.previewManager.setActivePage(null, null);
    }

    renderPages(pages, activePage, staggerDelay) {
        this.activePage = activePage;
        this.uiManager.renderRecentPages(
            pages,
            activePage,
            this.onSelectPage,
            staggerDelay
        );
    }

    openActivePage() {
        if (!this.activePage || !this.previewUrl) return;

        window.open(
            this.previewUrl,
            "_blank"
        );
    }
}
