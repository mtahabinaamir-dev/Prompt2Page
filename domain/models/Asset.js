class Asset {
    constructor({
        id = null,
        projectId = null,
        fileName = null,
        filePath = null,
        fileSize = null,
        mimeType = null,
        width = null,
        height = null,
        createdAt = null
    } = {}) {
        this.id = id;
        this.projectId = projectId;
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.width = width;
        this.height = height;
        this.createdAt = createdAt;
    }

    validate() {
        const errors = [];

        if (!this.fileName) {
            errors.push('File name is required');
        }

        if (this.fileName && typeof this.fileName !== 'string') {
            errors.push('File name must be a string');
        }

        if (this.fileName && this.fileName.length < 1) {
            errors.push('File name must be at least 1 character');
        }

        if (this.fileName && this.fileName.length > 255) {
            errors.push('File name must be at most 255 characters');
        }

        if (!this.filePath) {
            errors.push('File path is required');
        }

        if (this.filePath && typeof this.filePath !== 'string') {
            errors.push('File path must be a string');
        }

        if (this.fileSize !== null && typeof this.fileSize !== 'number') {
            errors.push('File size must be a number');
        }

        if (this.fileSize !== null && this.fileSize < 0) {
            errors.push('File size must be non-negative');
        }

        if (!this.mimeType) {
            errors.push('MIME type is required');
        }

        if (this.mimeType && typeof this.mimeType !== 'string') {
            errors.push('MIME type must be a string');
        }

        if (this.mimeType && !this.mimeType.includes('/')) {
            errors.push('MIME type must be in format "type/subtype"');
        }

        if (this.width !== null && typeof this.width !== 'number') {
            errors.push('Width must be a number');
        }

        if (this.width !== null && this.width < 0) {
            errors.push('Width must be non-negative');
        }

        if (this.height !== null && typeof this.height !== 'number') {
            errors.push('Height must be a number');
        }

        if (this.height !== null && this.height < 0) {
            errors.push('Height must be non-negative');
        }

        if (this.projectId && typeof this.projectId !== 'string') {
            errors.push('Project ID must be a string');
        }

        if (this.createdAt && !(this.createdAt instanceof Date) && typeof this.createdAt !== 'string') {
            errors.push('Created at must be a Date or ISO string');
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
            fileName: this.fileName,
            filePath: this.filePath,
            fileSize: this.fileSize,
            mimeType: this.mimeType,
            width: this.width,
            height: this.height,
            createdAt: this.createdAt instanceof Date ? this.createdAt.toISOString() : this.createdAt
        };
    }

    static fromJSON(data) {
        return new Asset({
            id: data.id,
            projectId: data.projectId,
            fileName: data.fileName,
            filePath: data.filePath,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            width: data.width,
            height: data.height,
            createdAt: data.createdAt ? new Date(data.createdAt) : null
        });
    }
}

module.exports = Asset;