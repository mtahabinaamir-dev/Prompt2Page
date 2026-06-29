const state = require("./state");
const commandConfig = require("../registry/commandConfig");

function handlePendingAction(input) {

    if (!state.pendingAction) {
        return null;
    }

    const pending = state.pendingAction;

    // Confirmation actions
    if (pending.action === "SWITCH_EXISTING_PAGE") {

        state.pendingAction = null;

        const answer = input.toLowerCase().trim();

        const yesWords = ["yes", "y", "ok", "okay", "sure", "yep"];

        if (yesWords.includes(answer)) {

            return {
                action: "SWITCH_PAGE",
                pageName: pending.pageName
            };

        }

        return {
            action: "UNKNOWN"
        };

    }

    const config = commandConfig[pending.action];

    if (!config) {

        state.pendingAction = null;
        return null;

    }

    // Restore previous data

    const result = {
        ...(pending.result || {})
    };

    // Fill in the missing field

    if (
        pending.action === "ADD_LIST" &&
        pending.missingField === "items"
    ) {

        result.items = input
            .split(",")
            .map(item => item.trim())
            .filter(item => item.length);

    }
    else {

        result[pending.missingField] = input.trim();

    }

    // Check if another field is still missing

    if (config.requiredFields) {

        for (const field of config.requiredFields) {

            if (!result[field]) {

                state.pendingAction = {
                    action: pending.action,
                    result,
                    missingField: field
                };

                return {
                    action: "__FOLLOW_UP__",
                    reply: config.followUp[field]
                };

            }

        }

    }

    state.pendingAction = null;

    return {
        action: pending.action,
        ...result
    };

}

module.exports = handlePendingAction;