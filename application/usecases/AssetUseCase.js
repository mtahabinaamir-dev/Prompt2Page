class AssetUseCase {

    constructor(assetService) {

        this.assetService = assetService;

    }

    upload(data) {

        if (!data || (!data.fileName && !data.filePath)) {

            return {
                success: false,
                error: "File name or file path is required"
            };

        }

        return this.assetService.upload(data);

    }

    replace(data) {

        if (!data || (!data.id && !data.fileName)) {

            return {
                success: false,
                error: "Asset ID or file name is required for replace"
            };

        }

        return this.assetService.replace(data);

    }

    rename(data) {

        if (!data || (!data.id && !data.fileName)) {

            return {
                success: false,
                error: "Asset ID or file name is required for rename"
            };

        }

        if (!data.newFileName || typeof data.newFileName !== "string" || !data.newFileName.trim()) {

            return {
                success: false,
                error: "New file name is required"
            };

        }

        return this.assetService.rename(data);

    }

    delete(data) {

        if (!data || (!data.id && !data.fileName)) {

            return {
                success: false,
                error: "Asset ID or file name is required for delete"
            };

        }

        return this.assetService.delete(data);

    }

    list() {

        const result = this.assetService.list();

        if (Array.isArray(result)) {

            return {
                success: true,
                assets: result
            };

        }

        return result;

    }

}

module.exports = AssetUseCase;