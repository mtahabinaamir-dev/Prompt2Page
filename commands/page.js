const container = require("../bootstrap/container");
const responseBuilder = require("../presentation/helpers/responseBuilder");

module.exports = {

    create(data) {

        const pageUseCase = container.get("PageUseCase");

        const result = pageUseCase.create(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Page created successfully.",
            result
        );

    },

    rename(data) {

        const pageUseCase = container.get("PageUseCase");

        const result = pageUseCase.rename(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Page renamed successfully.",
            result
        );

    },

    delete(data) {

        const pageUseCase = container.get("PageUseCase");

        const result = pageUseCase.delete(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Page deleted successfully.",
            result
        );

    },

    switch(data) {

        const pageUseCase = container.get("PageUseCase");

        const result = pageUseCase.switch(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            `Switched to page '${result.page.name}'.`,
            result
        );

    },

    list() {

        const pageUseCase = container.get("PageUseCase");

        const result = pageUseCase.list();

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            `${result.pages.length} page(s) found.`,
            result
        );

    },

    setHomepage(data) {

        const pageUseCase = container.get("PageUseCase");

        const result = pageUseCase.setHomepage(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            `Homepage set to '${result.page.name}'.`,
            result
        );

    }

};
