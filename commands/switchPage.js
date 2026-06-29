const state = require("../utils/state");
const { success } = require("../utils/responseBuilder");

function switchPage(data) {

    const { pageName } = data;

    state.activePage = pageName;

    return success(
        `✅ Switched to page "${pageName}".`,
        {
            activePage: pageName
        }
    );

}

module.exports = switchPage;