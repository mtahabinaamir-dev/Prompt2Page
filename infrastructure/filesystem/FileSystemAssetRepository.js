const fs = require("fs");
const path = require("path");

const Asset = require("../../domain/models/Asset");

class FileSystemAssetRepository {

    getAssetsFolder(projectId) {

        return path.join(
            process.cwd(),
            "generated",
            "projects",
            projectId,
            "assets"
        );

    }

    getAssetsMetadataFile(projectId) {

        return path.join(
            this.getAssetsFolder(projectId),
            "assets.json"
        );

    }

    getAssetFilePath(projectId, fileName) {

        return path.join(
            this.getAssetsFolder(projectId),
            fileName
        );

    }

    findByProjectId(projectId) {

        const metaFile = this.getAssetsMetadataFile(projectId);

        if (!fs.existsSync(metaFile)) {

            return [];

        }

        try {

            const data = JSON.parse(fs.readFileSync(metaFile, "utf8"));

            return data.map(item => Asset.fromJSON(item));

        } catch (error) {

            return [];

        }

    }

    findById(projectId, assetIdOrFileName) {

        const assets = this.findByProjectId(projectId);

        return assets.find(a => a.id === assetIdOrFileName || a.fileName === assetIdOrFileName) || null;

    }

    findByFileName(projectId, fileName) {

        return this.findById(projectId, fileName);

    }

    create(asset, content = null) {

        const folder = this.getAssetsFolder(asset.projectId);

        fs.mkdirSync(folder, { recursive: true });

        const destFilePath = this.getAssetFilePath(asset.projectId, asset.fileName);

        if (content !== null && content !== undefined) {

            fs.writeFileSync(destFilePath, content);

        } else if (asset.filePath && fs.existsSync(asset.filePath) && asset.filePath !== destFilePath) {

            fs.copyFileSync(asset.filePath, destFilePath);

        }

        if (fs.existsSync(destFilePath)) {

            const stat = fs.statSync(destFilePath);
            asset.fileSize = stat.size;

        }

        asset.filePath = destFilePath;

        const assets = this.findByProjectId(asset.projectId);

        const idx = assets.findIndex(a => a.id === asset.id || a.fileName === asset.fileName);

        if (idx !== -1) {

            assets[idx] = asset;

        } else {

            assets.push(asset);

        }

        fs.writeFileSync(
            this.getAssetsMetadataFile(asset.projectId),
            JSON.stringify(assets.map(a => a.toJSON()), null, 2),
            "utf8"
        );

        return Asset.fromJSON(asset.toJSON());

    }

    update(asset, content = null) {

        return this.create(asset, content);

    }

    rename(projectId, oldIdOrFileName, newFileName, updatedAsset) {

        const assets = this.findByProjectId(projectId);

        const idx = assets.findIndex(a => a.id === oldIdOrFileName || a.fileName === oldIdOrFileName);

        const oldFileName = idx !== -1 ? assets[idx].fileName : oldIdOrFileName;

        const oldFilePath = this.getAssetFilePath(projectId, oldFileName);
        const newFilePath = this.getAssetFilePath(projectId, newFileName);

        if (fs.existsSync(oldFilePath) && oldFilePath !== newFilePath) {

            fs.renameSync(oldFilePath, newFilePath);

        }

        updatedAsset.fileName = newFileName;
        updatedAsset.filePath = newFilePath;

        if (idx !== -1) {

            assets[idx] = updatedAsset;

        } else {

            assets.push(updatedAsset);

        }

        fs.writeFileSync(
            this.getAssetsMetadataFile(projectId),
            JSON.stringify(assets.map(a => a.toJSON()), null, 2),
            "utf8"
        );

        return Asset.fromJSON(updatedAsset.toJSON());

    }

    delete(projectId, assetIdOrFileName) {

        const assets = this.findByProjectId(projectId);

        const idx = assets.findIndex(a => a.id === assetIdOrFileName || a.fileName === assetIdOrFileName);

        if (idx === -1) {

            return false;

        }

        const target = assets[idx];

        const filePath = this.getAssetFilePath(projectId, target.fileName);

        if (fs.existsSync(filePath)) {

            fs.unlinkSync(filePath);

        }

        assets.splice(idx, 1);

        fs.writeFileSync(
            this.getAssetsMetadataFile(projectId),
            JSON.stringify(assets.map(a => a.toJSON()), null, 2),
            "utf8"
        );

        return true;

    }

    findAll({ projectId } = {}) {

        if (!projectId) return [];

        return this.findByProjectId(projectId);

    }

    exists(projectId, assetIdOrFileName) {

        return Boolean(this.findById(projectId, assetIdOrFileName));

    }

    countByProjectId(projectId) {

        return this.findByProjectId(projectId).length;

    }

}

module.exports = FileSystemAssetRepository;