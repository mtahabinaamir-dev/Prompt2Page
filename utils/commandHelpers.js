const pageEditor = require("./pageEditor");
const { success } = require("./responseBuilder");

function appendToMain(pageName, elementHtml, elementName) {

    pageEditor.appendToMain(
        pageName,
        elementHtml
    );

    return success(
        `✅ ${elementName} added to "${pageName}".`
    );

}

module.exports = {
    appendToMain
};