class Project {
    constructor({
        id = null,
        ownerId = null,
        name = null,
        slug = null,
        createdAt = null,
        updatedAt = null,
        designVariants = [],
        styleScopes = [],
        designSeed = null
    } = {}) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.slug = slug;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.designVariants = Array.isArray(designVariants) ? designVariants : [];
        this.styleScopes = Array.isArray(styleScopes) ? styleScopes : [];
        this.designSeed = Number.isInteger(designSeed) ? designSeed : null;
    }

    validate() {
        const errors = [];

        if (!this.name) {
            errors.push('Project name is required');
        }

        if (this.name && typeof this.name !== 'string') {
            errors.push('Project name must be a string');
        }

        if (this.name && this.name.length < 1) {
            errors.push('Project name must be at least 1 character');
        }

        if (this.name && this.name.length > 255) {
            errors.push('Project name must be at most 255 characters');
        }

        if (!this.slug) {
            errors.push('Project slug is required');
        }

        if (this.slug && typeof this.slug !== 'string') {
            errors.push('Project slug must be a string');
        }

        if (this.slug && !/^[a-z0-9-]+$/.test(this.slug)) {
            errors.push('Project slug must contain only lowercase letters, numbers, and hyphens');
        }

        if (this.slug && this.slug.length < 1) {
            errors.push('Project slug must be at least 1 character');
        }

        if (this.slug && this.slug.length > 255) {
            errors.push('Project slug must be at most 255 characters');
        }

        if (this.ownerId && typeof this.ownerId !== 'string') {
            errors.push('Owner ID must be a string');
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
            ownerId: this.ownerId,
            name: this.name,
            slug: this.slug,
            createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt,
            updatedAt: this.updatedAt instanceof Date ? this.updatedAt.toISOString() : this.updatedAt,
            designVariants: this.designVariants,
            styleScopes: this.styleScopes,
            designSeed: this.designSeed
        };
    }

    static fromJSON(data) {
        return new Project({
            id: data.id,
            ownerId: data.ownerId,
            name: data.name,
            slug: data.slug,
            createdAt: data.createdAt ? new Date(data.createdAt) : null,
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
            designVariants: data.designVariants,
            styleScopes: data.styleScopes,
            designSeed: data.designSeed
        });
    }
}

module.exports = Project;