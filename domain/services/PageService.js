const Page = require("../models/Page");
const projectState = require("../../application/state/ProjectState");

function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

class PageService {

    constructor(pageRepository) {

        this.pageRepository = pageRepository;

    }

    getActiveProject() {

        return projectState.get();

    }

    create(name, html = null, isHomepage = false) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        const pageId = generateSlug(name);

        if (!pageId) {

            return {
                success: false,
                error: "Invalid page name."
            };

        }

        const existing = this.pageRepository.findById(activeProject.id, pageId);

        if (existing) {

            return {
                success: false,
                error: "Page already exists in active project."
            };

        }

        const existingPages = this.pageRepository.findByProjectId(activeProject.id);

        const shouldBeHomepage = Boolean(isHomepage) || existingPages.length === 0;

        if (shouldBeHomepage) {

            existingPages.forEach(p => {
                if (p.isHomepage) {
                    p.isHomepage = false;
                    this.pageRepository.update(p);
                }
            });

        }

        const page = new Page({
            id: pageId,
            projectId: activeProject.id,
            name,
            html: html || `<!DOCTYPE html>\n<html>\n<head><title>${name}</title></head>\n<body>\n<h1>${name}</h1>\n</body>\n</html>`,
            isHomepage: shouldBeHomepage,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const validation = page.validate();

        if (!validation.isValid) {

            return {
                success: false,
                error: validation.errors.join("; ")
            };

        }

        const saved = this.pageRepository.create(page);

        if (!saved) {

            return {
                success: false,
                error: "Failed to create page"
            };

        }

        return {
            success: true,
            page: saved
        };

    }

    rename(id, newName) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        const existing = this.pageRepository.findById(activeProject.id, id);

        if (!existing) {

            return {
                success: false,
                error: "Page not found."
            };

        }

        const newId = generateSlug(newName);

        if (!newId) {

            return {
                success: false,
                error: "Invalid new page name."
            };

        }

        if (newId !== id && this.pageRepository.findById(activeProject.id, newId)) {

            return {
                success: false,
                error: "A page with this name already exists in active project."
            };

        }

        const updatedPage = new Page({
            id: newId,
            projectId: activeProject.id,
            name: newName,
            html: existing.html,
            isHomepage: existing.isHomepage,
            lockedElements: existing.lockedElements,
            createdAt: existing.createdAt,
            updatedAt: new Date()
        });

        const validation = updatedPage.validate();

        if (!validation.isValid) {

            return {
                success: false,
                error: validation.errors.join("; ")
            };

        }

        const saved = this.pageRepository.rename(activeProject.id, id, newId, updatedPage);

        return {
            success: true,
            page: saved
        };

    }

    delete(id) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        const existing = this.pageRepository.findById(activeProject.id, id);

        if (!existing) {

            return {
                success: false,
                error: "Page not found."
            };

        }

        const deleted = this.pageRepository.delete(activeProject.id, id);

        if (!deleted) {

            return {
                success: false,
                error: "Failed to delete page."
            };

        }

        if (existing.isHomepage) {

            const remainingPages = this.pageRepository.findByProjectId(activeProject.id);

            if (remainingPages.length > 0) {

                remainingPages[0].isHomepage = true;
                remainingPages[0].updatedAt = new Date();
                this.pageRepository.update(remainingPages[0]);

            }

        }

        return {
            success: true
        };

    }

    switch(id) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        let page = this.pageRepository.findById(activeProject.id, id);

        if (!page) {

            const pages = this.pageRepository.findByProjectId(activeProject.id);
            page = pages.find(p => p.id === id || p.name.toLowerCase() === id.toLowerCase()) || null;

        }

        if (!page) {

            return {
                success: false,
                error: "Page not found."
            };

        }

        return {
            success: true,
            page
        };

    }

    list() {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        return this.pageRepository.findByProjectId(activeProject.id);

    }

    setHomepage(id) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        const targetPage = this.pageRepository.findById(activeProject.id, id);

        if (!targetPage) {

            return {
                success: false,
                error: "Page not found."
            };

        }

        const pages = this.pageRepository.findByProjectId(activeProject.id);

        pages.forEach(p => {
            if (p.isHomepage && p.id !== id) {
                p.isHomepage = false;
                this.pageRepository.update(p);
            }
        });

        targetPage.isHomepage = true;
        targetPage.updatedAt = new Date();

        const updated = this.pageRepository.update(targetPage);

        return {
            success: true,
            page: updated
        };

    }

}

module.exports = PageService;