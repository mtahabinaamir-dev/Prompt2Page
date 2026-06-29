function extract(intent, text, original) {

    switch (intent) {

        case "CREATE_PAGE": {

            let match =
                    original.match(/(?:named|called)\s+(\w+)/i);

            if (!match) {
                match =
                    original.match(/^create\s+(\w+)\s+page$/i);
            }
            if (!match) {
                match =
                    original.match(/^build\s+(\w+)\s+page$/i);
            }
            if (!match) {
                match =
                    original.match(/^make\s+(\w+)\s+page$/i);
            }

            if (!match) {
                match =
                    original.match(/^generate\s+(\w+)\s+page$/i);
            }
            
            if (
                text.toLowerCase().includes("homepage") ||
                text.toLowerCase().includes("home page")
            ) {

                return {

                    pageName: "home"

                };

            }

            return {
                pageName: match
                    ? match[1]
                    : null
            };
        }

        case "ADD_HEADING": {

            const headingMatch =
                original.match(
                    /(?:add heading|create heading|insert heading|put heading|place heading|add title|create title|insert title)\s+(.+)/i
                );
            return {
                text: headingMatch
                    ? headingMatch[1]
                    : null
            };
        }

        case "SWITCH_PAGE": {

            const switchMatch =
                text.match(
                    /(?:switch to|edit page|go to|work on)\s+(\w+)/
                );
            return {
                pageName: switchMatch
                    ? switchMatch[1]
                    : null
            };
        }

        case "ADD_PARAGRAPH": {

            const paragraphMatch =
                original.match(
                    /(?:add paragraph|create paragraph|insert paragraph|write paragraph|add text|create text|insert text|add description)\s+(.+)/i
                );
            return {
                text: paragraphMatch
                    ? paragraphMatch[1]
                    : null
            };
        }

        case "ADD_BUTTON": {

            const buttonMatch =
                original.match(
                    /(?:add button|create button|insert button|put button|place button|make button)\s+(.+)/i
                );
            return {
                text: buttonMatch
                    ? buttonMatch[1]
                    : null
            };
        }

        case "CHANGE_BACKGROUND": {

            const backgroundMatch =
                original.match(
                    /(?:change background|set background|make background)\s+(.+)/i
                );
            return {
                color: backgroundMatch
                    ? backgroundMatch[1]
                    : null
            };
        }

        case "ADD_LINK": {

            const linkMatch =
                original.match(
                    /(?:add link|create link|insert link|place link)\s+(.+)/i
                );
            if (!linkMatch) {
                return {
                    text: null,
                    url: null
                };
            }

            const parts = linkMatch[1].trim().split(/\s+/);

            const url = parts.find(part =>
                part.startsWith("http://") ||
                part.startsWith("https://")
            );

            const linkText = parts
                .filter(part => part !== url)
                .join(" ");

            return {
                text: linkText || null,
                url: url || null
            };
        }

        case "ADD_IMAGE": {

            const imageMatch =
                original.match(
                    /(?:add image|create image|insert image|place image|add picture|create picture|insert picture|add photo|create photo|insert photo)\s+(.+)/i
                );
            if (!imageMatch) {
                return {
                    src: null,
                    alt: ""
                };
            }
            return {
                src: imageMatch[1].trim(),
                alt: ""
            };
        }

        case "CHANGE_TEXT_COLOR": {

            const colorMatch =
                original.match(
                    /(?:text color|font color|change text to|make text)\s+(.+)/i
                );
            return {
                color: colorMatch
                    ? colorMatch[1]
                    : null
            };
        }

        case "CHANGE_FONT_SIZE": {

            const sizeMatch =
                original.match(
                    /(?:font size|text size)\s+(.+)/i
                );
            return {
                size: sizeMatch
                    ? sizeMatch[1]
                    : null
            };
        }

        case "CHANGE_FONT": {

            const fontMatch =
                original.match(
                    /(?:change font|set font|font family)\s+(.+)/i
                );
            return {
                font: fontMatch
                    ? fontMatch[1]
                    : null
            };
        }

        case "ADD_LIST": {

            const listMatch =
                original.match(
                    /(?:add list|create list|insert list|bullet list)\s+(.+)/i
                );
            if (!listMatch) {
                return {
                    items: null
                };
            }
            return {
                items: listMatch[1]
                    .split(",")
                    .map(item => item.trim())
                    .filter(item => item.length)
            };
        }

        case "ADD_DIV": {

            const divMatch =
                original.match(
                    /(?:add div|create div|insert div|place div)\s+(.+)/i
                );
            return {
                text: divMatch
                    ? divMatch[1]
                    : null
            };
        }

        case "ADD_SECTION": {

            const sectionMatch =
                original.match(
                    /(?:add section|create section|insert section|place section)\s+(.+)/i
                );
            return {
                text: sectionMatch
                    ? sectionMatch[1]
                    : null
            };
        }

        case "ADD_INPUT": {

            const inputMatch =
                original.match(
                    /(?:add input|create input|insert input|textbox|text field)\s+(.+)/i
                );
            return {
                placeholder: inputMatch
                    ? inputMatch[1]
                    : null
            };
        }

        case "ADD_NAVBAR": {
            return {};
        }

        case "ADD_CARD": {
            return {
                title: null,
                text: null
            };
        }

        case "ADD_FORM": {
            return {};
        }

        default:

        return {};
    }
}

module.exports = extract;