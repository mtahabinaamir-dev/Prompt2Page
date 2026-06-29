function detectIntent(text) {

    // CREATE PAGE
    if (text.startsWith("create") || text.startsWith("make") ||
        text.startsWith("build") || text.startsWith("generate")
    ) {

        if (text.includes("page") || text.includes("homepage") ||
            text.includes("home") || text.includes("website")
        ) {
            return "CREATE_PAGE";
        }

    }

    // ADD HEADING
    if (text.includes("add heading") || text.includes("create heading") ||
        text.includes("insert heading") || text.includes("put heading") ||
        text.includes("place heading") || text.includes("add title") ||
        text.includes("create title") || text.includes("insert title") ||
        text.includes("page title")
    ) {
        return "ADD_HEADING";
    }

    // SWITCH PAGE
    if (text.includes("switch to") || text.includes("edit page") ||
        text.includes("go to") || text.includes("work on")
    ) {
        return "SWITCH_PAGE";
    }

    // HELP
    if (text.includes("help") || text.includes("commands") || text.includes("show commands") ||
        text.includes("command list") || text.includes("available commands")
    ) {
        return "HELP";
    }

    // LIST PAGES
    if (text.includes("list pages") || text.includes("show pages") ||
        text.includes("what pages") || text.includes("all pages")
    ) {
        return "LIST_PAGES";
    }

    // SHOW PAGE
    if (text.includes("preview") || text.includes("show page") ||
        text.includes("open page") || text.includes("view page")
    ) {
        return "SHOW_PAGE";
    }

    // ADD PARAGRAPH
    if (text.includes("add paragraph") || text.includes("create paragraph") ||
        text.includes("insert paragraph") || text.includes("write paragraph") ||
        text.includes("add text") || text.includes("create text") ||
        text.includes("insert text") || text.includes("add description")
    ) {
        return "ADD_PARAGRAPH";
    }

    // ADD BUTTON
    if (text.includes("add button") || text.includes("create button") ||
        text.includes("insert button") || text.includes("put button") || 
        text.includes("make button") || text.includes("place button")
    ) {
        return "ADD_BUTTON";
    }

    // CHANGE BACKGROUND
    if (text.includes("change background") || text.includes("set background") ||
        text.includes("make background")
    ) {
        return "CHANGE_BACKGROUND";
    }

    // ADD LINK
    if (text.includes("add link") || text.includes("create link") ||
        text.includes("insert link") || text.includes("place link")
    ) {
        return "ADD_LINK";
    }

    // ADD IMAGE
    if (text.includes("add image") || text.includes("create image") ||
        text.includes("insert image") || text.includes("place image") ||
        text.includes("add picture") || text.includes("create picture") ||
        text.includes("insert picture") || text.includes("add photo") ||
        text.includes("create photo") || text.includes("insert photo")
    ) {
        return "ADD_IMAGE";
    }

    // CHANGE TEXT COLOR
    if (text.includes("text color") || text.includes("font color") ||
        text.includes("change text to") || text.includes("make text")
    ) {
        return "CHANGE_TEXT_COLOR";
    }

    // CHANGE FONT SIZE
    if (text.includes("font size") ||
        text.includes("text size")
    ) {
        return "CHANGE_FONT_SIZE";
    }

    // CHANGE FONT
    if (text.includes("change font") || text.includes("set font") ||
        text.includes("font family")
    ) {
        return "CHANGE_FONT";
    }

    // ADD LIST
    if (text.includes("add list") || text.includes("create list") ||
        text.includes("insert list") || text.includes("bullet list")
    ) {
        return "ADD_LIST";
    }

    // ADD DIV
    if (text.includes("add div") || text.includes("create div") ||
        text.includes("insert div") || text.includes("place div")
    ) {
        return "ADD_DIV";
    }

    // ADD SECTION
    if (text.includes("add section") || text.includes("create section") ||
        text.includes("insert section") || text.includes("place section")
    ) {
        return "ADD_SECTION";
    }

    // ADD NAVBAR
    if (text.includes("add navbar") || text.includes("create navbar") ||
        text.includes("insert navbar") ||text.includes("add navigation") ||
        text.includes("create navigation") || text.includes("navigation bar")
    ) {
        return "ADD_NAVBAR";
    }

    // ADD CARD
    if (text.includes("add card") || text.includes("create card") ||
        text.includes("insert card") || text.includes("place card")
    ) {
        return "ADD_CARD";
    }

    // ADD INPUT
    if (text.includes("add input") || text.includes("create input") ||
        text.includes("insert input") || text.includes("textbox") ||
        text.includes("text field")
    ) {
        return "ADD_INPUT";
    }

    // ADD FORM
    if (text.includes("add form") || text.includes("create form") ||
        text.includes("insert form") ||text.includes("contact form")
    ) {
        return "ADD_FORM";
    }

    return "UNKNOWN";
}

module.exports = detectIntent;