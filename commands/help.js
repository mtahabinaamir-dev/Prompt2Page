const { success } = require("../utils/responseBuilder");

function help() {

    return success(`🚀 Prompt2Page Commands
        📄 Pages
        • create page named home
        • switch to home
        • list pages
        • show page

        📝 Content
        • add heading Welcome
        • add paragraph This is my website
        • add button Contact Us
        • add image https://example.com/image.jpg
        • add link Google https://google.com
        • add list HTML,CSS,JavaScript

        💡 Tips
        • You can type commands naturally.
        • Capital letters don't matter.
        • Extra spaces are ignored.

        ❓ Need inspiration?
        Ask:
        • how do i create a page
        • how do i add a button
        • what can you do

        🤖 Prompt2Page AI
        Type "who created you" to learn the story behind Prompt2Page.
            `);

}

module.exports = help;