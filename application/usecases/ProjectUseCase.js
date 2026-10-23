const pageState = require("../state/PageState");

class ProjectUseCase {

    constructor(projectService, pageService) {

        this.projectService = projectService;
        this.pageService = pageService;

    }

    create(data) {

        if (!data || !data.name || typeof data.name !== "string" || !data.name.trim()) {

            return {
                success: false,
                error: "Project name is required"
            };

        }

        return this.projectService.create(
            data.name.trim(),
            data.ownerId
        );

    }

    rename(data) {

        if (!data || !data.id || typeof data.id !== "string" || !data.id.trim()) {

            return {
                success: false,
                error: "Project ID is required"
            };

        }

        if (!data.newName || typeof data.newName !== "string" || !data.newName.trim()) {

            return {
                success: false,
                error: "New project name is required"
            };

        }

        return this.projectService.rename(
            data.id.trim(),
            data.newName.trim()
        );

    }

    delete(data) {

        if (!data || !data.id || typeof data.id !== "string" || !data.id.trim()) {

            return {
                success: false,
                error: "Project ID is required"
            };

        }

        return this.projectService.delete(data.id.trim());

    }

    switch(data) {

        if (!data || !data.id || typeof data.id !== "string" || !data.id.trim()) {

            return {
                success: false,
                error: "Project ID is required"
            };

        }

        const result = this.projectService.switch(data.id.trim());

        if (!result.success) {

            return result;

        }

        const pagesResult = this.pageService ? this.pageService.list() : [];
        const pages = Array.isArray(pagesResult) ? pagesResult : (pagesResult.pages || []);

        const lastActivePage = pageState.getLastActive(result.project.id);
        const page = pages.find(candidate => candidate.id === lastActivePage?.id)
            || pages.find(candidate => candidate.isHomepage)
            || pages.find(candidate => candidate.id === "home")
            || pages[0]
            || null;

        if (page) {

            pageState.set(page);

        } else {

            pageState.clear();

        }

        return {
            ...result,
            pages,
            page,
            previewUrl: page
                ? `/generated/projects/${result.project.id}/pages/${page.id}/index.html`
                : `/generated/projects/${result.project.id}/index.html`,
            refreshPreview: true
        };

    }

    list() {

        return {

            success: true,
            projects: this.projectService.list()

        };

    }

}

module.exports = ProjectUseCase;
