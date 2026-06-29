const htmlElements = require("../utils/htmlElements");
const { appendToMain } = require("../utils/commandHelpers");

function addHeading(data) {

    return appendToMain(
        data.pageName,
        htmlElements.heading(data.text),
        "Heading"
    );

}

module.exports = addHeading;