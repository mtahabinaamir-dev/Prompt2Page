const pageState = require("../state/PageState");

class PageUseCase {

    constructor(pageService) {

        this.pageService = pageService;

    }

    create(data) {

        if (!data || !data.name || typeof data.name !== "string" || !data.name.trim()) {

            return {
                success: false,
                error: "Page name is required"
            };

        }

        return this.pageService.create(
            data.name.trim(),
            data.html,
            data.isHomepage
        );

    }

    rename(data) {

        if (!data || !data.id || typeof data.id !== "string" || !data.id.trim()) {

            return {
                success: false,
                error: "Page ID is required"
            };

        }

        if (!data.newName || typeof data.newName !== "string" || !data.newName.trim()) {

            return {
                success: false,
                error: "New page name is required"
            };

        }

        return this.pageService.rename(
            data.id.trim(),
            data.newName.trim()
        );

    }

    delete(data) {

        if (!data || !data.id || typeof data.id !== "string" || !data.id.trim()) {

            return {
                success: false,
                error: "Page ID is required"
            };

        }

        return this.pageService.delete(data.id.trim());

    }

    switch(data) {

        if (!data || !data.id || typeof data.id !== "string" || !data.id.trim()) {

            return {
                success: false,
                error: "Page ID is required"
            };

        }

        const result = this.pageService.switch(data.id.trim());

        if (!result.success) {

            return result;

        }

        pageState.set(result.page);

        return {
            ...result,
            previewUrl: `/generated/projects/${result.page.projectId}/pages/${result.page.id}/index.html`,
            refreshPreview: true
        };

    }

    list() {

        const result = this.pageService.list();

        if (Array.isArray(result)) {

            return {
                success: true,
                pages: result
            };

        }

        return result;

    }

    setHomepage(data) {

        if (!data || !data.id || typeof data.id !== "string" || !data.id.trim()) {

            return {
                success: false,
                error: "Page ID is required"
            };

        }

        return this.pageService.setHomepage(data.id.trim());

    }

}

module.exports = PageUseCase;
