class PageState {

    constructor() {

        this.activePage = null;
        this.lastActivePages = new Map();

    }

    set(page) {

        this.activePage = page;

        if (page && page.projectId) {

            this.lastActivePages.set(page.projectId, page);

        }

    }

    get() {

        return this.activePage;

    }

    getLastActive(projectId) {

        return this.lastActivePages.get(projectId) || null;

    }

    clear() {

        this.activePage = null;

    }

}

module.exports = new PageState();
