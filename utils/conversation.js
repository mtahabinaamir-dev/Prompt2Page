function randomReply(replies) {
    return replies[
        Math.floor(Math.random() * replies.length)
    ];
}

    const websiteSuggestions = [
        {
            keywords: ["portfolio", "resume", "cv", "developer portfolio", "personal portfolio", "my portfolio"],
            emoji: "💼",
            page: "portfolio",
            description: "projects, skills and contact information"
        },
        {
            keywords: ["login", "log in", "sign in", "signin", "authentication", "member login"],
            emoji: "🔐",
            page: "login",
            description: "a login form with inputs and a button"
        },
        {
            keywords: ["contact", "contact us", "support", "get in touch", "reach us"],
            emoji: "📞",
            page: "contact",
            description: "a contact form and contact details"
        },
        {
            keywords: ["landing", "landing page", "startup", "product page", "homepage"],
            emoji: "🚀",
            page: "landing",
            description: "a modern landing page"
        },
        {
            keywords: ["blog", "blogs", "news", "article", "articles"],
            emoji: "📰",
            page: "blog",
            description: "articles, headings and images"
        },
        {
            keywords: ["shop", "store", "shopping", "online store", "shopping website", "ecommerce", "e-commerce", "online shop"],
            emoji: "🛒",
            page: "shop",
            description: "product cards and shopping features"
        },
        {
            keywords: ["restaurant", "food", "cafe", "coffee shop", "bakery", "diner"],
            emoji: "🍽️",
            page: "restaurant",
            description: "menus, food images and contact information"
        },
        {
            keywords: ["personal", "personal website", "profile", "about me", "my website"],
            emoji: "👤",
            page: "home",
            description: "a personal homepage"
        }
    ];

function getWebsiteSuggestion(text) {
    for (const site of websiteSuggestions) {
        for (const keyword of site.keywords) {
            if (text.includes(keyword)) {
                return randomReply([
                    `${site.emoji} That sounds like a great project!
                    Let's begin by creating your page.
                    Type:
                    create page named ${site.page}
                    Once it's ready, I'll help you build ${site.description}.`,

                    `${site.emoji} I'd be happy to help you build that!
                    Start with:
                    create page named ${site.page}
                    After that, we'll add ${site.description} together.`,

                    `${site.emoji} Excellent choice!
                    First create your page by typing:
                    create page named ${site.page}
                    Then I'll guide you through building it step by step.`
                ]);
            }
        }
    }
    return null;
}

function getConversationReply(message) {
    const text = message.toLowerCase().trim();

    // Greetings
    if (
        ["hello", "hi", "hey", "heya", "hiya", "yo", "sup", "whats up", "greetings", "hello there", "hey there", "hi there"].includes(text)
    ) {
        return randomReply([
            `👋 Hello! I'm your AI Website Builder.
            I can help you create websites using simple natural language commands.
            What would you like to build today?`,

            `🚀 Welcome!
            Whether you're building a portfolio, landing page, blog or online store, I'm here to help.
            What would you like to create?`,

            `😊 Hi there!
            I'm ready to help you build your website step by step.
            What's your first idea?`
        ]);
    }

    if (
        ["good morning", "good afternoon", "good evening"].includes(text)
    ) {
        return randomReply([
            `☀️ Hello!
            I hope you're having a great day.
            What website would you like to build today?`,
        ]);
    }

    // How are you
    if (
    [
        "how are you", "how are you?", "how are u", "how are u?", "how r you", "how r you?", "how r u", "how r u?", "hows it going",
        "hows it going?","how is it going","how is it going?", "how have you been", "how have you been?", 
        "everything good", "everything good?", "you good", "you good?"].includes(text)
    ) {
        return randomReply([
            `😄 I'm doing great!
            I'm ready to help you build an amazing website.
            What shall we create next?`,

            `😊 I'm doing well!
            Thanks for asking.
            What would you like to build today?`,

            `🚀 I'm always ready to design and build websites with you.
            What's your next idea?`
        ]);
    }

    // Thanks
    if (["thanks", "thanks!", "thank you", "thank you!", "thanks a lot", "thanks a lot!", "thank you so much",
        "thank you so much!", "many thanks", "many thanks!", "ty", "thx", "appreciate it", "appreciate it!"].includes(text)
    ) {
        return randomReply([
            `😊 You're very welcome!
            I'm always here if you need help building your website.
            What would you like to build next?`,

            `💙 Happy to help!
            Whenever you're ready, just give me your next command.`,

            `🚀 Anytime!
            Let's keep building something amazing together.`
        ]);
    }

    // Bye
    if (["bye", "bye!", "goodbye", "goodbye!", "see you", "see you!", "see ya", "see ya!", "cya", "cya!",
        "catch you later", "catch you later!", "farewell", "farewell!", "have a nice day", "have a good day"].includes(text)
    ) {
        return randomReply([
            `👋 Thanks for building with me!
            Have a great day and happy coding!`,

            `😊 Goodbye!
            I hope your website turns out amazing.
            See you next time!`,

            `🚀 It was fun building with you.
            Good luck with your project!`
        ]);
    }

    // About
    if (
        ["who are you", "who are you?", "what are you", "what are you?", "introduce yourself", "tell me about yourself",
        "tell me about yourself?","who am i talking to", "who am i talking to?", "what is prompt2page", "what is prompt2page?"].includes(text)
    ) {
        return randomReply([
            `🤖 I'm Prompt2Page, an AI website-building assistant.
            I can create and edit webpages using simple natural language commands.`,

            `💻 I'm Prompt2Page.
            Describe the website you want, and I'll help build it step by step without needing complex code.`,

            `🚀 I'm Prompt2Page, your AI website-building partner.
            Just tell me what you'd like to create, and I'll help turn your ideas into a working website.`
        ]);
    }

    // Capabilities
    if (
        ["what can you do", "what can you do?", "what do you do", "what do you do?", "capabilities", 
        "features", "what are your features", "what are your features?"].includes(text)
    ) {
        return randomReply([
            `🤖 I can help you build websites step by step.
            I can create pages, headings, paragraphs, buttons, images, forms, navigation bars and much more.
            Type "help" to see every command.`,

            `🚀 I understand natural language website commands.
            Simply tell me what you'd like to build, and I'll guide you through it.`,

            `💻 From creating pages to designing layouts, I'm here to help.
            Type "help" whenever you'd like to explore everything I can do.`
        ]);
    }

    // Name
    if (
        ["what is your name", "what is your name?", "your name", "your name?", "name", "name?", "what should i call you",
        "what should i call you?", "do you have a name", "do you have a name?"].includes(text)
    ) {
        return randomReply([
            `🤖 I'm Prompt2Page, your AI website-building assistant.`,

            `🚀 My name is Prompt2Page.
            My goal is simple: turn your prompts into real webpages.`,

            `💻 I'm Prompt2Page.
            From Prompt to Page—that's exactly what I do.`
        ]);
    }

    // Creator
    if (
        ["who made you", "who made you?", "who created you", "who created you?", "who built you", "who built you?",
        "who developed you", "who developed you?", "who programmed you", "who programmed you?", "who coded you", "who coded you?"].includes(text)
    ) {
        return randomReply([
            `💙 Prompt2Page was created as a university project by Muhammad Taha and Afnan.
            Muhammad Taha designed the AI logic and backend, while Afnan developed the frontend and user experience.
            The project demonstrates how AI can be used as a development partner. With the right guidance, AI helps developers learn faster, solve problems, and transform ideas into real software.`,

            `🚀 Prompt2Page was built by Muhammad Taha and Afnan.
            Using JavaScript, Node.js, and AI-assisted development, they transformed an idea into a working AI Website Builder.
            The goal of Prompt2Page is to show that AI isn't just something you chat with—it can also help you build your own ideas into real applications.`
        ]);
    }

    // Compliments
    if (["good job", "good job!", "nice", "nice!", "awesome", "awesome!", "great", "great!", "cool", "cool!", "excellent", "excellent!", 
        "amazing", "amazing!", "fantastic", "fantastic!", "brilliant", "perfect", "well done", "good work"].includes(text)
    ) {
        return randomReply([
            `😊 Thank you!
            I'm really glad you're enjoying it.
            Let's keep building something awesome!`,

            `🚀 Thanks!
            Your website is coming together nicely.
            What's next?`,

            `💙 I appreciate that!
            Tell me what feature you'd like to build next.`
        ]);
    }

    // Love
    if (["i love you", "i love you!", "love you", "love you!", "you are awesome", "you are amazing", "you are the best", 
        "you are cool"].includes(text)
    ) {
        return randomReply([
            `❤️ That's really kind of you!
            I'm happy to help you build your website.`,

            `😊 Thank you!
            Let's make your website even better together.`,

            `💙 I appreciate it!
            Now, what shall we build next?`
        ]);
    }

    // Joke
    if (["joke", "joke?", "tell me a joke", "tell me a joke?", "make me laugh", "make me laugh?", "say something funny",
        "say something funny?", "funny"].includes(text)
    ) {
        return randomReply([
            `😂 Why do programmers prefer dark mode?
            Because light attracts bugs!`,

            `🤣 Why was the HTML page always calm?
            Because it had good style!`,

            `😄 Why did the CSS file go to therapy?
            It had too many class issues!`,

            `😂 Why do JavaScript developers wear glasses?
            Because they can't C#!`
        ]);
    }

    // Commands
    if (["commands", "commands?", "show commands", "show commands?", "available commands", "available commands?", "what commands",
        "what commands?", "list commands", "list commands?", "command list"].includes(text)
    ) {
        return randomReply([
            `📋 You can type "help" to see every available command.
            I'll show examples for each one too.`,

            `💻 Type "help" whenever you'd like to explore everything I can do.`,

            `🚀 Need command examples?
            Just type "help" and I'll list them for you.`
        ]);
    }

    // Negative replies
    if (
        ["no", "nope", "nah"].includes(text)
    ) {
        return randomReply([
            `👍 No problem!
            Let me know whenever you're ready.`,

            `😊 That's completely fine.
            Just tell me what you'd like to do next.`,

            `🚀 Alright!
            I'm here whenever you need me.`
        ]);
    }
    
    // Sorry
    if (
        ["sorry", "my bad", "oops" ].includes(text)
    ) {
        return randomReply([
            `😊 No worries!
            Let's continue building your website.`,

            `💙 That's okay!
            What would you like to do next?`,

            `🚀 No problem at all!
            Let's keep going.`
        ]);
    }

    // Comparison
    if (text.includes("are you better") ||text.includes("better than") ||
        text.includes("chatgpt") || text.includes("gemini")
    ) {
        return randomReply([
            `🤖 My job is a little different.
            I'm designed specifically to help build websites through natural language commands.`,

            `😊 Different AI assistants have different strengths.
            I'm focused on helping you create websites quickly and easily.`
        ]);
    }

    // Build help
    if (text.includes("help me build") || text.includes("build a website") ||
        text.includes("make me a website")
    ) {
        return randomReply([
            `🚀 I'd love to!
            Tell me what kind of website you'd like to create, and we'll build it together.`,

            `💻 Absolutely!
            Describe your website idea, and I'll guide you step by step.`
        ]);
    }

    // Help Examples
    if (text.includes("how do i create a page") ||
       text.includes("how to create a page")
    ) {
        return randomReply([
            `📄 Creating a page is easy.
            Type:
            create page named home
            Replace "home" with any page name you'd like.`,

            `🚀 To create a new webpage, simply type:
            create page named portfolio
            You can replace "portfolio" with any page name.`
        ]);
    }

    if (text.includes("how do i add a heading") ||
        text.includes("how to add a heading")
    ) {
        return randomReply([
          `📝 To add a heading, type:
            add heading Welcome
            You can also say:
            create title Welcome`,

            `💻 Headings are simple to add.
            Example:
            add heading My Website`
        ]);
    }

    if (text.includes("how do i add a paragraph") ||
        text.includes("how to add a paragraph")
    ) {
        return randomReply([
            `📄 To add a paragraph, type:
            add paragraph This is my website`,
            
            `💬 Another example is:
            insert paragraph Welcome to my website`
        ]);
    }

    if (text.includes("how do i add a button") ||
        text.includes("how to add a button")
    ) {
        return randomReply([
            `🔘 To add a button, type:
            add button Login`,

            `🚀 You can also use:
            create button Sign In`
        ]);
    }

    if (text.includes("how do i add an image") ||
        text.includes("how to add an image")
    ) {
        return randomReply([
            `🖼️ To insert an image, type:
            add image https://example.com/image.jpg
            Replace the link with your own image URL.`
        ]);
    }

    if (text.includes("how do i preview") ||
        text.includes("how to preview")
    ) {
        return randomReply([
            `👁️ Once you've created a page, click the Preview Page button to open the live preview.
            Your preview updates automatically while you build.`,

            `🌐 The Preview Page button opens a live preview of your active page.
            Click it again anytime to hide the preview.`
        ]);
    }

    if (text.includes("what commands") || text.includes("available commands") ||
        text.includes("which commands")
    ) {
        return randomReply([
            `📋 Type "help" to see every command I support, along with examples for each one.`,

            `💻 Need inspiration?
            Type "help" to explore all available website-building commands.`
        ]);
    }

    // Simple confirmations
    if (
        ["yes", "yeah", "yep", "ok", "okay", "sure", "sounds good", "perfect"].includes(text)
    ) {
        return randomReply([
            `😊 Great!
            What would you like to build next?`,

            `🚀 Awesome!
            Tell me your next website command.`,

            `💻 Sounds good!
            What's the next feature you'd like to add?`,

            `👍 Perfect!
            I'm ready whenever you are.`
        ]);
    }

    // Positive reactions
    if (
        ["good", "excellent", "amazing"].includes(text)
    ) {
        return randomReply([
            `😊 I'm glad you think so!
            Let's keep building something awesome.`,

            `🚀 Thank you!
            Your website is coming together nicely.`,

            `💙 Happy to hear that!
            What's the next thing you'd like to add?`
        ]);
    }

    const suggestion = getWebsiteSuggestion(text);

    if (suggestion) return suggestion;

    return null;

}

module.exports = getConversationReply;