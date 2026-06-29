const pageEditor = require("../utils/pageEditor");
const htmlElements = require("../utils/htmlElements");
const { success } = require("../utils/responseBuilder");

function addNavbar(data) {

    const { pageName } = data;

    pageEditor.edit(
        pageName,
        (html) => {

            return html.replace(
                /<main id="content"(?:\s+style="[^"]*")?>/,
                (match) => `${htmlElements.navbar()}
            ${match}`
            );

        }
    );

    return success(
        `✅ Navbar added to "${pageName}".`
    );

}

module.exports = addNavbar;