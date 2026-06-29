const htmlElements = require("../utils/htmlElements");
const { appendToMain } = require("../utils/commandHelpers");

function addParagraph(data) {

    return appendToMain(
        data.pageName,
        htmlElements.paragraph(data.text),
        "Paragraph"
    );

}

module.exports = addParagraph;