const Component = require("../models/Component");
const projectState = require("../../application/state/ProjectState");
const { groupBySection } = require("../../application/utils/sections");
const { escapeHtml } = require("../../application/utils/escapeHtml");

class ComponentService {

    constructor(componentRepository, pageRepository) {

        this.componentRepository = componentRepository;
        this.pageRepository = pageRepository;

    }

    getActiveProject() {

        return projectState.get();

    }

    resolvePageId(projectId, requestedPageId) {

        if (requestedPageId) {
            return requestedPageId;
        }

        const pages = this.pageRepository.findByProjectId(projectId);

        if (!pages || pages.length === 0) {
            return null;
        }

        const homepage = pages.find(p => p.isHomepage);

        return homepage ? homepage.id : pages[0].id;

    }

    _syncPageHTML(projectId, pageId) {

        const page = this.pageRepository.findById(projectId, pageId);

        if (!page) return;

        const components = this.componentRepository.findByPage(projectId, pageId);

        // Same section grouping as the preview renderer, so the exported
        // page.html carries the data-section wrappers scoped CSS targets.
        const bodyHtml = groupBySection(components).map(group => {
            const inner = group.items.map(c => c.toHTML()).join("\n");
            return group.section
                ? `<section class="site-section" data-section="${escapeHtml(group.section)}">\n${inner}\n</section>`
                : inner;
        }).join("\n");

        page.html = `<!DOCTYPE html>\n<html>\n<head><title>${page.name}</title></head>\n<body>\n${bodyHtml}\n</body>\n</html>`;
        page.updatedAt = new Date();

        this.pageRepository.update(page);

    }

    add({ pageId, type, content = "", level = "h2", alt = "", section = null, properties = {} } = {}) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        const targetPageId = this.resolvePageId(activeProject.id, pageId);

        if (!targetPageId) {

            return {
                success: false,
                error: "No pages exist in the active project. Please create a page first."
            };

        }

        const page = this.pageRepository.findById(activeProject.id, targetPageId);

        if (!page) {

            return {
                success: false,
                error: "Page not found."
            };

        }

        const allowedTypes = ["heading", "paragraph", "button", "image", "form", "gallery", "table", "map", "icons", "cards", "tabs"];

        if (!type || !allowedTypes.includes(type)) {

            return {
                success: false,
                error: `Unsupported component type: '${type}'. Allowed types are: ${allowedTypes.join(", ")}.`
            };

        }

        const compId = `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const comp = new Component({
            id: compId,
            pageId: targetPageId,
            projectId: activeProject.id,
            type,
            content,
            level,
            alt,
            section,
            properties,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const validation = comp.validate();

        if (!validation.isValid) {

            return {
                success: false,
                errors: validation.errors
            };

        }

        const saved = this.componentRepository.add(comp);

        this._syncPageHTML(activeProject.id, targetPageId);

        return {
            success: true,
            component: saved
        };

    }

    edit({ pageId, componentId, index, content, level, alt, styles } = {}) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected."
            };

        }

        const targetPageId = this.resolvePageId(activeProject.id, pageId);

        if (!targetPageId) {

            return {
                success: false,
                error: "Page not found."
            };

        }

        const components = this.componentRepository.findByPage(activeProject.id, targetPageId);

        let comp = null;

        if (componentId) {

            comp = components.find(c => c.id === componentId);

        } else if (typeof index === "number" && index >= 0 && index < components.length) {

            comp = components[index];

        }

        if (!comp) {

            return {
                success: false,
                error: "Component not found."
            };

        }

        if (content !== undefined) comp.content = content;
        if (level !== undefined) comp.level = level;
        if (alt !== undefined) comp.alt = alt;
        if (styles !== undefined && styles && typeof styles === "object") {
            comp.styles = { ...(comp.styles || {}), ...styles };
        }
        comp.updatedAt = new Date();

        const validation = comp.validate();

        if (!validation.isValid) {

            return {
                success: false,
                errors: validation.errors
            };

        }

        const updated = this.componentRepository.update(comp);

        this._syncPageHTML(activeProject.id, targetPageId);

        return {
            success: true,
            component: updated
        };

    }

    delete({ pageId, componentId, index } = {}) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected."
            };

        }

        const targetPageId = this.resolvePageId(activeProject.id, pageId);

        if (!targetPageId) {

            return {
                success: false,
                error: "Page not found."
            };

        }

        const components = this.componentRepository.findByPage(activeProject.id, targetPageId);

        let comp = null;

        if (componentId) {

            comp = components.find(c => c.id === componentId);

        } else if (typeof index === "number" && index >= 0 && index < components.length) {

            comp = components[index];

        }

        if (!comp) {

            return {
                success: false,
                error: "Component not found."
            };

        }

        const deleted = this.componentRepository.delete(activeProject.id, targetPageId, comp.id);

        if (!deleted) {

            return {
                success: false,
                error: "Failed to delete component."
            };

        }

        this._syncPageHTML(activeProject.id, targetPageId);

        return {
            success: true
        };

    }

    move({ pageId, componentId, fromIndex, toIndex, direction } = {}) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected."
            };

        }

        const targetPageId = this.resolvePageId(activeProject.id, pageId);

        if (!targetPageId) {

            return {
                success: false,
                error: "Page not found."
            };

        }

        const components = this.componentRepository.findByPage(activeProject.id, targetPageId);

        if (components.length === 0) {

            return {
                success: false,
                error: "No components to move."
            };

        }

        let srcIdx = -1;

        if (componentId) {

            srcIdx = components.findIndex(c => c.id === componentId);

        } else if (typeof fromIndex === "number") {

            srcIdx = fromIndex;

        }

        if (srcIdx < 0 || srcIdx >= components.length) {

            return {
                success: false,
                error: "Target component not found."
            };

        }

        let destIdx = srcIdx;

        if (typeof toIndex === "number") {

            destIdx = toIndex;

        } else if (direction === "up") {

            destIdx = Math.max(0, srcIdx - 1);

        } else if (direction === "down") {

            destIdx = Math.min(components.length - 1, srcIdx + 1);

        }

        destIdx = Math.max(0, Math.min(components.length - 1, destIdx));

        const [item] = components.splice(srcIdx, 1);

        components.splice(destIdx, 0, item);

        const savedList = this.componentRepository.saveAll(activeProject.id, targetPageId, components);

        this._syncPageHTML(activeProject.id, targetPageId);

        return {
            success: true,
            components: savedList
        };

    }

}

module.exports = ComponentService;