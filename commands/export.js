const container = require("../bootstrap/container");
const responseBuilder = require("../presentation/helpers/responseBuilder");

module.exports = {

    html(data) {

        const exportUseCase = container.get("ExportUseCase");

        const result = exportUseCase.exportHTML(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Project exported to HTML successfully.",
            result
        );

    },

    async zip(data) {

        const exportUseCase = container.get("ExportUseCase");

        const result = await exportUseCase.exportZIP(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Project exported to ZIP package successfully.",
            result
        );

    },

    platform(data) {

        const exportUseCase = container.get("ExportUseCase");

        const result = exportUseCase.exportPlatform(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            `Platform architecture prepared for ${result.platform}.`,
            result
        );

    },

    history(data) {

        const exportUseCase = container.get("ExportUseCase");

        const result = exportUseCase.history(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            `${result.history.length} export job(s) found in history.`,
            result
        );

    }

};
