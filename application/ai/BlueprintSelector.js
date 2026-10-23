const BlueprintLibrary = require("./BlueprintLibrary");

class BlueprintSelector {

    constructor(blueprintLibrary) {

        this.blueprintLibrary = blueprintLibrary || new BlueprintLibrary();

    }

    select(plan) {

        const { projectName = "Generated Project", topic = "general" } = plan || {};

        return this.blueprintLibrary.getBlueprint(topic, projectName);

    }

}

module.exports = BlueprintSelector;
