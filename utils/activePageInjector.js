const state = require("./state");

function injectActivePage(result, config) {

    if (!config || !config.needsActivePage) {
        return {
            success: true,
            result
        };
    }

    if (!state.activePage) {
        return {
            success: false,
            reply: "No active page selected."
        };
    }

    result.pageName = state.activePage;

    return {
        success: true,
        result
    };

}

module.exports = injectActivePage;