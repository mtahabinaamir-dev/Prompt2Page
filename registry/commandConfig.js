module.exports = {

    CREATE_PAGE: {
        needsActivePage: false,
        requiredFields: ["pageName"],
        followUp: {
            pageName: "What would you like to name the page?"
        }
    },

    ADD_HEADING: {
        needsActivePage: true,
        requiredFields: ["text"],
        followUp: {
            text: "What should the heading say?"
        }
    },

    ADD_PARAGRAPH: {
        needsActivePage: true,
        requiredFields: ["text"],
        followUp: {
            text: "What should the paragraph say?"
        }
    },

    ADD_BUTTON: {
        needsActivePage: true,
        requiredFields: ["text"],
        followUp: {
            text: "What should the button say?"
        }
    },

    CHANGE_BACKGROUND: {
        needsActivePage: true,
        requiredFields: ["color"],
        followUp: {
            color: "What color should the background be?"
        }
    },

    ADD_LINK: {
        needsActivePage: true,
        requiredFields: ["text", "url"],
        followUp: {
            text: "What should the link say?",
            url: "What URL should the link point to?"
        }
    },

    ADD_IMAGE: {
        needsActivePage: true,
        requiredFields: ["src"],
        followUp: {
            src: "What is the image URL?"
        }
    },

    CHANGE_TEXT_COLOR: {
        needsActivePage: true,
        requiredFields: ["color"],
        followUp: {
            color: "What color should the text be?"
        }
    },

    CHANGE_FONT_SIZE: {
        needsActivePage: true,
        requiredFields: ["size"],
        followUp: {
            size: "What font size should I use?"
        }
    },

    CHANGE_FONT: {
        needsActivePage: true,
        requiredFields: ["font"],
        followUp: {
            font: "Which font should I use?"
        }
    },

    ADD_LIST: {
        needsActivePage: true,
        requiredFields: ["items"],
        followUp: {
            items: "What items should be in the list? Separate them with commas."
        }
    },

    ADD_DIV: {
        needsActivePage: true,
        requiredFields: ["text"],
        followUp: {
            text: "What should the div contain?"
        }
    },

    ADD_SECTION: {
        needsActivePage: true,
        requiredFields: ["text"],
        followUp: {
            text: "What should the section contain?"
        }
    },

    ADD_CARD: {
        needsActivePage: true,
        requiredFields: ["title", "text"],
        followUp: {
            title: "What should the card title be?",
            text: "What should the card text be?"
        }
    },

    ADD_INPUT: {
        needsActivePage: true,
        requiredFields: ["placeholder"],
        followUp: {
            placeholder: "What placeholder should the input have?"
        }
    },

    ADD_FORM: {
        needsActivePage: true
    },

    ADD_NAVBAR: {
        needsActivePage: true
    },

    SWITCH_PAGE: {
        needsActivePage: false
    },

    LIST_PAGES: {
        needsActivePage: false
    },

    SHOW_PAGE: {
        needsActivePage: false
    },

    HELP: {
        needsActivePage: false
    }

};