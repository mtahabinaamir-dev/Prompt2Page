const container = require("../bootstrap/container");
const responseBuilder = require("../presentation/helpers/responseBuilder");

module.exports = {

    generate(data) {

        const aiOrchestrator = container.get("AIOrchestrator");

        const useCases = {
            projectUseCase: container.get("ProjectUseCase"),
            pageUseCase: container.get("PageUseCase"),
            componentUseCase: container.get("ComponentUseCase")
        };

        const result = aiOrchestrator.generateWebsite(
            data && data.prompt,
            useCases
        );

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        // AIOrchestrator already produces reply, summary, and renders HTML.
        // Commands simply forward the response.
        return responseBuilder.success(
            result.reply || result.summary,
            result,
            true
        );

    },

    regenerate(data) {

        return this.generate(data);

    }

};
