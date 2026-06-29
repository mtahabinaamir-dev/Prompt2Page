const pageEditor = require("../utils/pageEditor");
const { success } = require("../utils/responseBuilder");

function changeFont(data) {

    const { pageName, font } = data;

    pageEditor.edit(
        pageName,
        (html) => {

            return html.replace(
                /<main id="content"(?:\s+style="[^"]*")?>/,
                `<main id="content" style="font-family: ${font};">`
            );

        }
    );

    return success(
        `✅ Font changed to "${font}" on "${pageName}".`
    );

}

module.exports = changeFont;