const htmlElements = require("../utils/htmlElements");
const { appendToMain } = require("../utils/commandHelpers");

function addLink(data) {

    return appendToMain(
        data.pageName,
        htmlElements.link(data.text, data.url),
        "Link"
    );

}

module.exports = addLink;