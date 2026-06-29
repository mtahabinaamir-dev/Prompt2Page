function heading(text) {

    return `
        <h1>${text}</h1>
    `;
}

function paragraph(text) {

    return `
        <p>${text}</p>
    `;
}

function button(text) {

    return `
        <button>${text}</button>
    `;
}

function link(text, url) {

    return `
        <a href="${url}">${text}</a>
    `;
}

function image(src, alt = "") {

    return `
        <img src="${src}" alt="${alt}">
    `;
}

function list(items) {

    const html = items
        .map(item => `        <li>${item}</li>`)
        .join("\n");

    return `
        <ul>
            ${html}
        </ul>
    `;
}

function div(text = "") {

    return `
        <div>
            ${text}
        </div>
    `;
}

function section(text = "") {

    return `
        <section>
            ${text}
        </section>
    `;
}

function navbar() {

    return `
        <nav>
            <a href="#">Home</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
        </nav>
    `;
}

function card(title, text) {

    return `
        <div class="card">
            <h3>${title}</h3>
            <p>${text}</p>
        </div>
    `;
}

function input(placeholder) {

    return `
        <input
            type="text"
            placeholder="${placeholder}"
        >
    `;
}

function form() {

    return `
        <form>
            <input
                type="text"
                placeholder="Enter text"
            >
            <button>
                Submit
            </button>
        </form>
    `;
}

module.exports = {
    heading,
    paragraph,
    button,
    link,
    image,
    list,
    div,
    section,
    navbar,
    card,
    input,
    form,
};