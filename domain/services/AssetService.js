const path = require("path");
const Asset = require("../models/Asset");
const projectState = require("../../application/state/ProjectState");

function inferMimeType(fileName) {

    const ext = path.extname(fileName || "").toLowerCase();

    switch (ext) {

        case ".png":
            return "image/png";

        case ".jpg":
        case ".jpeg":
            return "image/jpeg";

        case ".gif":
            return "image/gif";

        case ".webp":
            return "image/webp";

        case ".svg":
            return "image/svg+xml";

        default:
            return "application/octet-stream";

    }

}

class AssetService {

    constructor(assetRepository) {

        this.assetRepository = assetRepository;

    }

    getActiveProject() {

        return projectState.get();

    }

    upload({ fileName, filePath, content = null, mimeType = null, fileSize = null, width = null, height = null } = {}) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        const name = fileName || (filePath ? path.basename(filePath) : null);

        if (!name) {

            return {
                success: false,
                error: "File name or file path is required."
            };

        }

        // Never allow directories or traversal in the stored file name.
        const safeName = path.basename(name).toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^\.+/, "");

        if (!safeName) {

            return {
                success: false,
                error: "Invalid file name."
            };

        }

        const existing = this.assetRepository.findById(activeProject.id, name);

        if (existing) {

            return {
                success: false,
                error: "Asset with this file name already exists."
            };

        }

        const assetMimeType = mimeType || inferMimeType(safeName);
        const id = safeName.replace(/[^a-z0-9.-]/g, "-");

        const asset = new Asset({
            id,
            projectId: activeProject.id,
            fileName: safeName,
            filePath: safeName,
            fileSize: fileSize || 0,
            mimeType: assetMimeType,
            width,
            height,
            createdAt: new Date()
        });

        const validation = asset.validate();

        if (!validation.isValid) {

            return {
                success: false,
                errors: validation.errors
            };

        }

        const saved = this.assetRepository.create(asset, content);

        return {
            success: true,
            asset: saved
        };

    }

    replace({ id, fileName, newFilePath, content = null, mimeType = null } = {}) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected."
            };

        }

        const targetKey = id || fileName;

        if (!targetKey) {

            return {
                success: false,
                error: "Asset ID or file name is required for replace."
            };

        }

        const existing = this.assetRepository.findById(activeProject.id, targetKey);

        if (!existing) {

            return {
                success: false,
                error: "Asset not found."
            };

        }

        if (newFilePath) {

            existing.filePath = newFilePath;

        }

        if (mimeType) {

            existing.mimeType = mimeType;

        }

        const updated = this.assetRepository.update(existing, content);

        return {
            success: true,
            asset: updated
        };

    }

    rename({ id, fileName, newFileName } = {}) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected."
            };

        }

        const targetKey = id || fileName;

        if (!targetKey) {

            return {
                success: false,
                error: "Asset ID or file name is required."
            };

        }

        if (!newFileName || typeof newFileName !== "string" || !newFileName.trim()) {

            return {
                success: false,
                error: "New file name is required."
            };

        }

        const existing = this.assetRepository.findById(activeProject.id, targetKey);

        if (!existing) {

            return {
                success: false,
                error: "Asset not found."
            };

        }

        const cleanNewName = newFileName.trim();

        if (cleanNewName !== existing.fileName && this.assetRepository.findById(activeProject.id, cleanNewName)) {

            return {
                success: false,
                error: "An asset with this file name already exists."
            };

        }

        const newId = cleanNewName.toLowerCase().replace(/[^a-z0-9.-]/g, "-");

        const updatedAsset = new Asset({
            id: newId,
            projectId: activeProject.id,
            fileName: cleanNewName,
            filePath: existing.filePath,
            fileSize: existing.fileSize,
            mimeType: inferMimeType(cleanNewName),
            width: existing.width,
            height: existing.height,
            createdAt: existing.createdAt
        });

        const saved = this.assetRepository.rename(activeProject.id, existing.fileName, cleanNewName, updatedAsset);

        return {
            success: true,
            asset: saved
        };

    }

    delete({ id, fileName } = {}) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected."
            };

        }

        const targetKey = id || fileName;

        if (!targetKey) {

            return {
                success: false,
                error: "Asset ID or file name is required for delete."
            };

        }

        const existing = this.assetRepository.findById(activeProject.id, targetKey);

        if (!existing) {

            return {
                success: false,
                error: "Asset not found."
            };

        }

        const deleted = this.assetRepository.delete(activeProject.id, existing.fileName);

        if (!deleted) {

            return {
                success: false,
                error: "Failed to delete asset."
            };

        }

        return {
            success: true
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

        return this.assetRepository.findByProjectId(activeProject.id);

    }

}

module.exports = AssetService;