class IntentResolver {

    resolve(intentData) {

        if (!intentData || typeof intentData !== "object") {

            return { action: "UNKNOWN" };

        }

        const { intent, entities = {} } = intentData;

        switch (intent) {

            case "GENERATE_WEBSITE":
                return {
                    action: "GENERATE_WEBSITE",
                    prompt: entities.prompt || entities.topic || "Create a website",
                    topic: entities.topic || "general"
                };

            case "REGENERATE_WEBSITE":
                return {
                    action: "REGENERATE_WEBSITE",
                    prompt: entities.prompt || ""
                };

            case "DELETE_COMPONENT":
                return {
                    action: "DELETE_COMPONENT",
                    componentId: entities.componentId,
                    index: entities.index !== undefined ? entities.index : undefined
                };

            case "EDIT_COMPONENT":
                return {
                    action: "EDIT_COMPONENT",
                    componentId: entities.componentId,
                    index: entities.index !== undefined ? entities.index : undefined,
                    content: entities.content || ""
                };

            case "ADD_COMPONENT":
                return {
                    action: "ADD_COMPONENT",
                    type: entities.type || "paragraph",
                    content: entities.content || ""
                };

            case "MOVE_COMPONENT":
                const moveRes = {
                    action: "MOVE_COMPONENT",
                    componentId: entities.componentId,
                    fromIndex: entities.fromIndex !== undefined ? entities.fromIndex : entities.index
                };
                if (entities.toIndex !== undefined) {
                    moveRes.toIndex = entities.toIndex;
                }
                if (entities.direction !== undefined) {
                    moveRes.direction = entities.direction;
                }
                return moveRes;

            case "UPLOAD_ASSET":
                return {
                    action: "UPLOAD_ASSET",
                    filePath: entities.filePath || entities.fileName || "file",
                    fileName: entities.fileName || entities.filePath || "file"
                };

            case "REPLACE_ASSET":
                return {
                    action: "REPLACE_ASSET",
                    fileName: entities.fileName,
                    newFilePath: entities.newFilePath
                };

            case "RENAME_ASSET":
                return {
                    action: "RENAME_ASSET",
                    fileName: entities.fileName,
                    newFileName: entities.newFileName
                };

            case "DELETE_ASSET":
                return {
                    action: "DELETE_ASSET",
                    fileName: entities.fileName || entities.id
                };

            case "LIST_ASSETS":
                return {
                    action: "LIST_ASSETS"
                };

            case "EXPORT_HTML":
                return {
                    action: "EXPORT_HTML"
                };

            case "EXPORT_ZIP":
                return {
                    action: "EXPORT_ZIP"
                };

            case "EXPORT_PLATFORM":
                return {
                    action: "EXPORT_PLATFORM",
                    platform: entities.platform || "netlify"
                };

            case "EXPORT_HISTORY":
                return {
                    action: "EXPORT_HISTORY"
                };

            case "CREATE_PROJECT":
                return {
                    action: "CREATE_PROJECT",
                    name: entities.name || "New Project"
                };

            case "SWITCH_PROJECT":
                return {
                    action: "SWITCH_PROJECT",
                    id: entities.id || entities.name
                };

            case "RENAME_PROJECT":
                return {
                    action: "RENAME_PROJECT",
                    id: entities.id,
                    newName: entities.newName
                };

            case "DELETE_PROJECT":
                return {
                    action: "DELETE_PROJECT",
                    id: entities.id || entities.name
                };

            case "LIST_PROJECTS":
                return {
                    action: "LIST_PROJECTS"
                };

            case "CREATE_PAGE":
                return {
                    action: "CREATE_PAGE",
                    name: entities.name || "NewPage"
                };

            case "SWITCH_PAGE":
                return {
                    action: "SWITCH_PAGE",
                    id: entities.id || entities.name
                };

            case "RENAME_PAGE":
                return {
                    action: "RENAME_PAGE",
                    id: entities.id,
                    newName: entities.newName
                };

            case "DELETE_PAGE":
                return {
                    action: "DELETE_PAGE",
                    id: entities.id || entities.name
                };

            case "LIST_PAGES":
                return {
                    action: "LIST_PAGES"
                };

            case "SET_HOMEPAGE":
                return {
                    action: "SET_HOMEPAGE",
                    id: entities.id || entities.name
                };

            case "HELP":
                return {
                    action: "HELP"
                };

            default:
                return {
                    action: "UNKNOWN"
                };

        }

    }

}

module.exports = IntentResolver;
