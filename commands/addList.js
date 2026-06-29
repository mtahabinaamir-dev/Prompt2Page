const htmlElements = require("../utils/htmlElements");
const { appendToMain } = require("../utils/commandHelpers");

function addList(data) {

    return appendToMain(
        data.pageName,
        htmlElements.list(data.items),
        "List"
    );

}

module.exports = addList;