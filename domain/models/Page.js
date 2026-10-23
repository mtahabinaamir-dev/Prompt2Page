class Page {
    constructor({
        id = null,
        projectId = null,
        name = null,
        html = null,
        createdAt = null,
        updatedAt = null,
        isHomepage = false,
        lockedElements = [],
        styles = null,
        seoTitle = null,
        seoDescription = null
    } = {}) {
        this.id = id;
        this.projectId = projectId;
        this.name = name;
        this.html = html;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.isHomepage = isHomepage;
        this.lockedElements = Array.isArray(lockedElements) ? lockedElements : [];
        this.styles = styles && typeof styles === "object" ? styles : null;
        this.seoTitle = seoTitle || null;
        this.seoDescription = seoDescription || null;
    }

    validate() {
        const errors = [];

        if (!this.name) {
            errors.push('Page name is required');
        }

        if (this.name && typeof this.name !== 'string') {
            errors.push('Page name must be a string');
        }

        if (this.name && this.name.length < 1) {
            errors.push('Page name must be at least 1 character');
        }

        if (this.name && this.name.length > 255) {
            errors.push('Page name must be at most 255 characters');
        }

        if (this.name && !/^[a-zA-Z0-9-_ ]+$/.test(this.name)) {
            errors.push('Page name must contain only letters, numbers, spaces, hyphens, and underscores');
        }

        if (!this.html) {
            errors.push('Page HTML is required');
        }

        if (this.html && typeof this.html !== 'string') {
            errors.push('Page HTML must be a string');
        }

        if (this.html && this.html.length < 1) {
            errors.push('Page HTML must be at least 1 character');
        }

        if (this.projectId && typeof this.projectId !== 'string') {
            errors.push('Project ID must be a string');
        }

        if (typeof this.isHomepage !== 'boolean') {
            errors.push('isHomepage must be a boolean');
        }

        if (!Array.isArray(this.lockedElements)) {
            errors.push('lockedElements must be an array');
        }

        if (this.lockedElements.some(el => typeof el !== 'string')) {
            errors.push('All locked elements must be strings');
        }

        if (this.createdAt && !(this.createdAt instanceof Date) && typeof this.createdAt !== 'string') {
            errors.push('Created at must be a Date or ISO string');
        }

        if (this.updatedAt && !(this.updatedAt instanceof Date) && typeof this.updatedAt !== 'string') {
            errors.push('Updated at must be a Date or ISO string');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    toJSON() {
        return {
            id: this.id,
            projectId: this.projectId,
            name: this.name,
            html: this.html,
            createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt,
            updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : this.updatedAt,
            isHomepage: this.isHomepage,
            lockedElements: this.lockedElements,
            styles: this.styles,
            seoTitle: this.seoTitle,
            seoDescription: this.seoDescription
        };
    }

    static fromJSON(data) {
        return new Page({
            id: data.id,
            projectId: data.projectId,
            name: data.name,
            html: data.html,
            createdAt: data.createdAt ? new Date(data.createdAt) : null,
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
            isHomepage: data.isHomepage || false,
            lockedElements: Array.isArray(data.lockedElements) ? data.lockedElements : [],
            styles: data.styles,
            seoTitle: data.seoTitle,
            seoDescription: data.seoDescription
        });
    }
}

module.exports = Page;