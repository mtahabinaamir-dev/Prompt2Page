class ExportJob {
    constructor({
        id = null,
        projectId = null,
        exportType = null,
        status = 'pending',
        exportPath = null,
        projectName = null,
        filename = null,
        createdAt = null,
        completedAt = null,
        error = null
    } = {}) {
        this.id = id;
        this.projectId = projectId;
        this.exportType = exportType;
        this.status = status;
        this.exportPath = exportPath;
        this.projectName = projectName;
        this.filename = filename;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
        this.error = error;
    }

    validate() {
        const errors = [];

        if (!this.projectId) {
            errors.push('Project ID is required');
        }

        if (this.projectId && typeof this.projectId !== 'string') {
            errors.push('Project ID must be a string');
        }

        if (!this.exportType) {
            errors.push('Export type is required');
        }

        if (this.exportType && typeof this.exportType !== 'string') {
            errors.push('Export type must be a string');
        }

        const validExportTypes = ['html', 'zip', 'github-pages', 'netlify', 'vercel'];
        if (this.exportType && !validExportTypes.includes(this.exportType)) {
            errors.push(`Export type must be one of: ${validExportTypes.join(', ')}`);
        }

        if (!this.status) {
            errors.push('Status is required');
        }

        if (this.status && typeof this.status !== 'string') {
            errors.push('Status must be a string');
        }

        const validStatuses = ['pending', 'processing', 'completed', 'failed'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
        }

        if (this.exportPath && typeof this.exportPath !== 'string') {
            errors.push('Export path must be a string');
        }

        if (this.projectName && typeof this.projectName !== 'string') {
            errors.push('Project name must be a string');
        }

        if (this.filename && typeof this.filename !== 'string') {
            errors.push('Filename must be a string');
        }

        if (this.error && typeof this.error !== 'string') {
            errors.push('Error must be a string');
        }

        if (this.createdAt && !(this.createdAt instanceof Date) && typeof this.createdAt !== 'string') {
            errors.push('Created at must be a Date or ISO string');
        }

        if (this.completedAt && !(this.completedAt instanceof Date) && typeof this.completedAt !== 'string') {
            errors.push('Completed at must be a Date or ISO string');
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
            exportType: this.exportType,
            status: this.status,
            exportPath: this.exportPath,
            projectName: this.projectName,
            filename: this.filename,
            createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt,
            completedAt: this.completedAt instanceof Date ? this.completedAt.toISOString() : this.completedAt,
            error: this.error
        };
    }

    static fromJSON(data) {
        return new ExportJob({
            id: data.id,
            projectId: data.projectId,
            exportType: data.exportType,
            status: data.status || 'pending',
            exportPath: data.exportPath,
            projectName: data.projectName,
            filename: data.filename,
            createdAt: data.createdAt ? new Date(data.createdAt) : null,
            completedAt: data.completedAt ? new Date(data.completedAt) : null,
            error: data.error
        });
    }
}

module.exports = ExportJob;