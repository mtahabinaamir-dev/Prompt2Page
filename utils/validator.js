const fileManager = require("./fileManager");
const { failure, success } = require("./responseBuilder");

function validate(result, config) {

    if (!config) {
        return success("");
    }

    if (config.requiredFields) {

        for (const field of config.requiredFields) {

            if (!result[field]) {

                return failure(
                    `Missing required field: ${field}`
                );

            }

        }

    }

    if (

        result.pageName &&

        result.action !== "CREATE_PAGE" &&

        !fileManager.pageExists(result.pageName)

    ) {

        return failure(
            `Page "${result.pageName}" does not exist.`
        );

    }

    return success("");

}

module.exports = validate;