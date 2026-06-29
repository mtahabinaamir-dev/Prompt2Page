const fileManager = require("./fileManager");

function edit(pageName, callback) {

    let html = fileManager.readPage(pageName);

    html = callback(html);

    fileManager.writePage(
        pageName,
        html
    );

}

function appendToMain(pageName, elementHtml) {

    edit(
        pageName,
        (html) => {

            return html.replace(
                "</main>",
                `${elementHtml}
    </main>`
            );

        }
    );

}

module.exports = {
    edit,
    appendToMain
};