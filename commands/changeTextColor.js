const pageEditor = require("../utils/pageEditor");
const { success } = require("../utils/responseBuilder");

function changeTextColor(data) {

    const { pageName, color } = data;

    pageEditor.edit(
        pageName,
        (html) => {

            return html.replace(
                /<main id="content"(?:\s+style="[^"]*")?>/,
                `<main id="content" style="color: ${color};">`
            );

        }
    );

    return success(
        `✅ Text color changed to "${color}" on "${pageName}".`
    );

}

module.exports = changeTextColor;