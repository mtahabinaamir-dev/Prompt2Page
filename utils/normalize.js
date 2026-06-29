function normalize(text) {

    return text
        .toLowerCase()
        .replace(/[?!.,]/g, "")
        .trim()
        .replace(/\s+/g, " ");

}

module.exports = normalize;