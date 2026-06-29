const normalize = require("./normalize");
const detectIntent = require("./intentEngine");
const extractEntities = require("./entityExtractor");

function parseCommand(input) {

    const original = input.trim();

    const normalized = normalize(input);

    const action = detectIntent(normalized);

    const entities = extractEntities(
        action,
        normalized,
        original
    );

    return {

        action,

        ...entities

    };

}

module.exports = parseCommand;