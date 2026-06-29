const state = require("../utils/state");
const { success, failure } = require("../utils/responseBuilder");

function showPage() {

    if (!state.activePage) {

        return failure(
            "No active page selected."
        );

    }

    return success(
        `SHOW_PAGE:${state.activePage}`
    );

}

module.exports = showPage;