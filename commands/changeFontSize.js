const pageEditor = require("../utils/pageEditor");
const { success } = require("../utils/responseBuilder");

function changeFontSize(data) {

    const { pageName, size } = data;

    pageEditor.edit(
        pageName,
        (html) => {

            return html.replace(
                /<main id="content"(?:\s+style="[^"]*")?>/,
                `<main id="content" style="font-size: ${size};">`
            );

        }
    );

    return success(
        `✅ Font size changed to "${size}" on "${pageName}".`
    );

}

module.exports = changeFontSize;