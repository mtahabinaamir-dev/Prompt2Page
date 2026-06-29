const htmlElements = require("../utils/htmlElements");
const { appendToMain } = require("../utils/commandHelpers");

function addParagraph(data) {

    return appendToMain(
        data.pageName,
        htmlElements.div(data.text),
        "Div"
    );

}

module.exports = addParagraph;