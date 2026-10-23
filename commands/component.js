const container = require("../bootstrap/container");
const responseBuilder = require("../presentation/helpers/responseBuilder");

module.exports = {

    add(data) {

        const componentUseCase = container.get("ComponentUseCase");

        const result = componentUseCase.add(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Component added successfully.",
            result
        );

    },

    edit(data) {

        const componentUseCase = container.get("ComponentUseCase");

        const result = componentUseCase.edit(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Component edited successfully.",
            result
        );

    },

    delete(data) {

        const componentUseCase = container.get("ComponentUseCase");

        const result = componentUseCase.delete(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Component deleted successfully.",
            result
        );

    },

    move(data) {

        const componentUseCase = container.get("ComponentUseCase");

        const result = componentUseCase.move(data);

        if (!result.success) {

            return responseBuilder.failure(result.error);

        }

        return responseBuilder.success(
            "Component moved successfully.",
            result
        );

    }

};
