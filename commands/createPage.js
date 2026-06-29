const state = require("../utils/state");
const fileManager = require("../utils/fileManager");
const defaultPage = require("../templates/defaultPage");
const { success, failure } = require("../utils/responseBuilder");

function createPage(data) {

    const { pageName } = data;

    if (fileManager.pageExists(pageName)) {

        state.pendingAction = {
            action: "SWITCH_EXISTING_PAGE",
            pageName
        };

        return failure(
            `⚠️ Page "${pageName}" already exists.\n\nWould you like to switch to it?`
        );

    }

    fileManager.writePage(
        pageName,
        defaultPage(pageName)
    );

    state.activePage = pageName;

    if (!state.pages.includes(pageName)) {

        state.pages.push(pageName);

    }

    return success(
        `✅ Created "${pageName}" and made it the active page.`,
        {
            activePage: pageName
        }
    );

}

module.exports = createPage;