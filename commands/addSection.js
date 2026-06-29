const htmlElements = require("../utils/htmlElements");
const { appendToMain } = require("../utils/commandHelpers");

function addParagraph(data) {

    return appendToMain(
        data.pageName,
        htmlElements.section(data.text),
        "Section"
    );
    
}

module.exports = addParagraph;