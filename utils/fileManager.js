const fs = require("fs");
const path = require("path");

function getPagePath(pageName) {
    return path.join(
        __dirname,
        "..",
        "generated",
        `${pageName}.html`
    );
}

function pageExists(pageName) {
    return fs.existsSync(
        getPagePath(pageName)
    );
}

function readPage(pageName) {
    return fs.readFileSync(
        getPagePath(pageName),
        "utf8"
    );
}

function writePage(pageName, content) {
    fs.writeFileSync(
        getPagePath(pageName),
        content
    );
}

module.exports = {
    getPagePath,
    pageExists,
    readPage,
    writePage
};