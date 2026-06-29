const createPage = require("../commands/createPage");
const addHeading = require("../commands/addHeading");
const switchPage = require("../commands/switchPage");
const help = require("../commands/help");
const listPages = require("../commands/listPages");
const showPage = require("../commands/showPage");
const addParagraph = require("../commands/addParagraph");
const addButton = require("../commands/addButton");
const changeBackground = require("../commands/changeBackground");
const addLink = require("../commands/addLink");
const addImage = require("../commands/addImage");
const changeTextColor = require("../commands/changeTextColor");
const changeFontSize = require("../commands/changeFontSize");
const changeFont = require("../commands/changeFont");
const addList = require("../commands/addList");
const addDiv = require("../commands/addDiv");
const addSection = require("../commands/addSection");
const addNavbar = require("../commands/addNavbar");
const addCard = require("../commands/addCard");
const addInput = require("../commands/addInput");
const addForm = require("../commands/addForm");

module.exports = {
    CREATE_PAGE: createPage,
    ADD_HEADING: addHeading,
    SWITCH_PAGE: switchPage,
    HELP: help,
    LIST_PAGES: listPages,
    SHOW_PAGE: showPage,
    ADD_PARAGRAPH: addParagraph,
    ADD_BUTTON: addButton,
    CHANGE_BACKGROUND: changeBackground,
    ADD_LINK: addLink,
    ADD_IMAGE: addImage,
    CHANGE_TEXT_COLOR: changeTextColor,
    CHANGE_FONT_SIZE: changeFontSize,
    CHANGE_FONT: changeFont,
    ADD_LIST: addList,
    ADD_DIV: addDiv,
    ADD_SECTION: addSection,
    ADD_NAVBAR: addNavbar,
    ADD_CARD: addCard,
    ADD_INPUT: addInput,
    ADD_FORM: addForm,
};