const container = require("../bootstrap/container");
const responseBuilder = require("../presentation/helpers/responseBuilder");

module.exports = {

    create(data) {

        const projectUseCase =
            container.get("ProjectUseCase");

        const result =
            projectUseCase.create({
                name: data.name
            });

        if (!result.success) {

            return responseBuilder.failure(
                result.error
            );

        }

        return responseBuilder.success(
            "Project created successfully.",
            result
        );

    },

    list() {

        const projectUseCase =
            container.get("ProjectUseCase");

        const result =
            projectUseCase.list();

        return responseBuilder.success(
            `${result.projects.length} project(s) found.`,
            result
        );

    },

    rename(data) {

        const projectUseCase =
            container.get("ProjectUseCase");

        const result =
            projectUseCase.rename({
                id: data.id,
                newName: data.newName
            });

        if (!result.success) {

            return responseBuilder.failure(
                result.error
            );

        }

        return responseBuilder.success(
            "Project renamed successfully.",
            result
        );

    },

    delete(data) {

        const projectUseCase =
            container.get("ProjectUseCase");

        const result =
            projectUseCase.delete({
                id: data.id
            });

        if (!result.success) {

            return responseBuilder.failure(
                result.error
            );

        }

        return responseBuilder.success(
            "Project deleted successfully.",
            result
        );

    },

    switch(data) {

        const projectUseCase =
            container.get("ProjectUseCase");

        const result =
            projectUseCase.switch({
                id: data.id
            });

        if (!result.success) {

            return responseBuilder.failure(
                result.error
            );

        }

        return responseBuilder.success(
            `Switched to project '${result.project.name}'.`,
            result
        );

    }

};