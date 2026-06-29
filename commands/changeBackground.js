const pageEditor = require("../utils/pageEditor");
const { success } = require("../utils/responseBuilder");

function changeBackground(data) {

    const { pageName, color } = data;

    pageEditor.edit(
        pageName,
        (html) => {

            // Body already has a style attribute
            if (html.includes("<body style=")) {

                return html.replace(
                    /<body style="([^"]*)">/,
                    (match, styles) => {

                        const cleaned = styles
                            .replace(/background\s*:[^;]+;?/g, "")
                            .trim();

                        const newStyles =
                            `${cleaned} background: ${color};`.trim();

                        return `<body style="${newStyles}">`;

                    }
                );

            }

            // Body has no style attribute
            return html.replace(
                "<body>",
                `<body style="background: ${color};">`
            );

        }
    );

    return success(
        `✅ Background changed to "${color}".`
    );

}

module.exports = changeBackground;