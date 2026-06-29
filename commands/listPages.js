const fs = require("fs");
const path = require("path");
const { success } = require("../utils/responseBuilder");

function listPages() {

    const generatedFolder = path.join(__dirname, "../generated");

    const pages = fs
        .readdirSync(generatedFolder)
        .filter(file => file.endsWith(".html"))
        .map(file => file.replace(".html", ""));

    if (pages.length === 0) {

        return success(
            "No pages have been created yet."
        );

    }

    const pageList = pages
        .map(page => `• ${page}`)
        .join("\n");

    return success(
        `📄 Your Pages\n\n${pageList}`
    );

}

module.exports = listPages;