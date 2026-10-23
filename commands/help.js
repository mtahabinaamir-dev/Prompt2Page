const responseBuilder = require("../presentation/helpers/responseBuilder");

module.exports = {

    help() {

        const capabilities = {
            naturalLanguage: [
                "Create a restaurant website",
                "Build me a barber shop",
                "I need a portfolio",
                "Delete the hero",
                "Make the heading bigger",
                "Change button color",
                "Upload logo",
                "Export project"
            ],
            commands: [
                "create project <name>",
                "switch project <id>",
                "create page <name>",
                "add component <type> <content>",
                "upload asset <filePath>",
                "export html",
                "export zip"
            ]
        };

        return responseBuilder.success(
            "Prompt2Page supports natural language prompts as well as explicit commands.",
            capabilities
        );

    }

};
