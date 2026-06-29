const sendBtn = document.getElementById("sendBtn");
const commandInput = document.getElementById("commandInput");
const chatBox = document.getElementById("chatBox");
const activePageSpan = document.getElementById("activePage");
const previewBtn = document.getElementById("previewBtn");
const previewFrame = document.getElementById("previewFrame");
const quickButtons = document.querySelectorAll(".quick-btn");
const previewPanel = document.querySelector(".preview-panel");

let previewVisible = false;
let waitingForReply = false;
let typingBubble = null;
let userTypingBubble = null;
let typingTimeout = null;

function getCurrentTime() {

    return new Date().toLocaleTimeString([], {

        hour: "2-digit",
        minute: "2-digit"

    });

}

function scrollToBottom() {

    chatBox.scrollTo({

        top: chatBox.scrollHeight,
        behavior: "smooth"

    });

}

function formatReply(text){

    return text

        // bold
        .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")

        // inline code
        .replace(/`(.*?)`/g,"<code>$1</code>")

        // line breaks
        .replace(/^- (.*)$/gm,"• $1")
        .replace(/\n/g,"<br>");

}

function addMessage(text, type) {

    const div = document.createElement("div");

    div.className = `message ${type}`;

    div.style.animation = "messageIn .45s cubic-bezier(.22,1,.36,1)";

    const avatar =
        type === "bot"
            ? "🤖"
            : "👤";

    div.innerHTML = `
        <div class="message-row">

            <div class="avatar">${avatar}</div>

            <div class="message-content">

                <div class="message-text">${formatReply(text)}</div>

                <div class="message-time">${getCurrentTime()}</div>

            </div>

        </div>
    `;

    chatBox.appendChild(div);

    scrollToBottom();

}

function showTyping() {

    if (typingBubble) return;

    typingBubble = document.createElement("div");

    typingBubble.className = "message bot";

    typingBubble.style.animation = "messageIn .45s cubic-bezier(.22,1,.36,1)";

    typingBubble.innerHTML = `

<div class="message-text">

🤖 <strong>Prompt2Page AI</strong>

<br><br>

<span class="typing-dots">

<span></span>

<span></span>

<span></span>

</span>

</div>

`;

    chatBox.appendChild(typingBubble);

    scrollToBottom();

}

function hideTyping() {

    if (typingBubble) {

        typingBubble.remove();

        typingBubble = null;

    }

}

function showUserTyping(){

    if(userTypingBubble) return;

    userTypingBubble = document.createElement("div");

    userTypingBubble.className = "message user";

    userTypingBubble.style.animation = "messageIn .45s cubic-bezier(.22,1,.36,1)";

    userTypingBubble.innerHTML = `

    <div class="message-text">

    👤 <strong>You</strong>

    <br><br>

    <span class="typing-dots">

    <span></span>

    <span></span>

    <span></span>

    </span>

    </div>`;

    chatBox.appendChild(userTypingBubble);

    scrollToBottom();

}

function hideUserTyping(){

    if(!userTypingBubble) return;

    userTypingBubble.remove();

    userTypingBubble = null;

}

function updateActivePage(reply) {

    const match = reply.match(/"([^"]+)"/);

    if (match) {

        activePageSpan.textContent = match[1];

    }

}

function refreshPreview() {

    if (!previewVisible) return;

    const page = activePageSpan.textContent;

    if (page === "None") {

        previewFrame.src = "/preview-placeholder.html";

        return;

    }

    previewFrame.src =
        `/generated/${page}.html?t=${Date.now()}`;

}

async function sendCommand(command = null) {

    const userCommand =
        command || commandInput.value.trim();

    if (!userCommand || waitingForReply)
        return;

    waitingForReply = true;

    sendBtn.disabled = true;

    hideUserTyping();

    addMessage(userCommand, "user");

    commandInput.value = "";

    showTyping();

    const thinkingStart = Date.now();

    try {

        const response = await fetch("/command", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                command: userCommand

            })

        });

        const data = await response.json();

        const elapsed = Date.now() - thinkingStart;

        const minimumThinking = 800;

        if (elapsed < minimumThinking) {

            await new Promise(resolve =>
                setTimeout(resolve, minimumThinking - elapsed)
            );

        }

        // Let the typing indicator stay visible briefly
        await new Promise(resolve => setTimeout(resolve, 700));

        hideTyping();

        if (
            data.reply.startsWith("SHOW_PAGE:")
        ) {

            const pageName =
                data.reply.replace("SHOW_PAGE:", "");

            window.open(
                `/generated/${pageName}.html`,
                "_blank"
            );

            addMessage(
                `🌐 Opening "<strong>${pageName}</strong>"...`,
                "bot"
            );

        }

        else {

            addMessage(data.reply, "bot");

        }

        if (

            data.reply.includes("Created") ||

            data.reply.includes("Switched")

        ) {

            updateActivePage(data.reply);

        }

        if (

            !data.reply.startsWith("SHOW_PAGE:") &&

            activePageSpan.textContent !== "None"

        ) {

            refreshPreview();

        }

    }

    catch (error) {

        hideTyping();

        addMessage(

            "❌ Unable to connect to Prompt2Page. Make sure the server is running.",

            "bot"

        );

    }

    finally {

        waitingForReply = false;

        sendBtn.disabled = false;

        commandInput.focus();

    }

}

sendBtn.addEventListener("click", () => {

    sendCommand();

});

commandInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        event.preventDefault();

        sendCommand();

    }

});

commandInput.addEventListener("input", () => {

    if(commandInput.value.trim().length){

        showUserTyping();

    }

    else{

        hideUserTyping();

    }

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {

        hideUserTyping();

    },700);

});

quickButtons.forEach(button => {

    button.addEventListener("click", () => {

        sendCommand(button.dataset.command);

    });

});

previewBtn.addEventListener("click", () => {

    previewVisible = !previewVisible;

    if (previewVisible) {

        previewPanel.style.display = "flex";

        requestAnimationFrame(() => {

            previewPanel.classList.add("show");

        });

        previewBtn.textContent = "🙈 Hide Preview";

        refreshPreview();

    }

    else {

        previewPanel.classList.remove("show");

        previewBtn.textContent = "👁️ Open Full Preview";

        setTimeout(() => {

            previewPanel.style.display = "none";

        }, 400);

    }

});

commandInput.focus();