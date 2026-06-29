const htmlElements = require("../utils/htmlElements");
const { appendToMain } = require("../utils/commandHelpers");

function addParagraph(data) {

    return appendToMain(
        data.pageName,
        htmlElements.card(data.title, data.text),
        "Card"
    );
    
}

module.exports = addParagraph;