const container = require("../bootstrap/container");
const responseBuilder = require("../presentation/helpers/responseBuilder");

module.exports = {

    upload(data) {

        const assetUseCase = container.get("AssetUseCase");

        const result = assetUseCase.upload(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Asset uploaded successfully.",
            result
        );

    },

    replace(data) {

        const assetUseCase = container.get("AssetUseCase");

        const result = assetUseCase.replace(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Asset replaced successfully.",
            result
        );

    },

    rename(data) {

        const assetUseCase = container.get("AssetUseCase");

        const result = assetUseCase.rename(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Asset renamed successfully.",
            result
        );

    },

    delete(data) {

        const assetUseCase = container.get("AssetUseCase");

        const result = assetUseCase.delete(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Asset deleted successfully.",
            result
        );

    },

    list() {

        const assetUseCase = container.get("AssetUseCase");

        const result = assetUseCase.list();

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            `${result.assets.length} asset(s) found.`,
            result
        );

    }

};
