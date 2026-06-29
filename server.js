const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const commands = require("./registry/commands");
const commandConfig = require("./registry/commandConfig");
const state = require("./utils/state");
const parseCommand = require("./utils/commandParser");
const handlePendingAction = require("./utils/pendingActionHandler");
const injectActivePage = require("./utils/activePageInjector");
const validate = require("./utils/validator");
const getConversationReply = require("./utils/conversation");

// Create generated folder automatically if it doesn't exist
const generatedDir = path.join(__dirname, "generated");

if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Static folders
app.use(express.static(path.join(__dirname, "public")));
app.use("/generated", express.static(path.join(__dirname, "generated")));

app.post("/command", (req, res) => {

    console.log("COMMAND RECEIVED:", req.body.command);

    const { command } = req.body;

    if (!command) {

        return res.json({
            success: false,
            reply: "No command received."
        });

    }
    
    // Handle pending conversation

    let result = handlePendingAction(command);
    console.log("Pending Result:", result);

    if (
        result &&
        result.action === "__FOLLOW_UP__"
    ) {

        return res.json({
            success: true,
            reply: result.reply
        });

    }

    if (!result) {

        result = parseCommand(command);
        console.log(result);
    }

    // Only use conversation AI if no command was detected

    if (result.action === "UNKNOWN") {

        const conversationReply = getConversationReply(command);

        if (conversationReply) {

            return res.json({

                success: true,

                reply: conversationReply

            });

        }

    }

    // Load command configuration

    const config = commandConfig[result.action];

    // Ask follow-up question

    if (
        config &&
        config.requiredFields
    ) {

        for (const field of config.requiredFields) {

            if (!result[field]) {

                state.pendingAction = {
                    action: result.action,
                    result,
                    missingField: field
                };

                return res.json({
                    success: true,
                    reply: config.followUp[field]
                });

            }

        }

    }

    // Inject active page

    const injection = injectActivePage(
        result,
        config
    );

    if (!injection.success) {

        return res.json(injection);

    }

    result = injection.result;

    // Validate command

    const validation =
        validate(result, config);

    if (!validation.success) {

        return res.json(validation);

    }
console.log("Final Result:", result);
    // Execute command

    const handler =
        commands[result.action];

    if (handler) {

        return res.json(
            handler(result)
        );

    }

    return res.json({
        success: false,
        reply: "Sorry, I don't understand that command yet."
    });

});

// START SERVER

app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});