const HTMLRenderer = require("./HTMLRenderer");
const CSSRenderer = require("./CSSRenderer");
const PreviewRenderer = require("./PreviewRenderer");

class Renderer {

    constructor(htmlRenderer, cssRenderer, previewRenderer) {

        this.htmlRenderer = htmlRenderer || new HTMLRenderer();
        this.cssRenderer = cssRenderer || new CSSRenderer();
        this.previewRenderer = previewRenderer || new PreviewRenderer(this.htmlRenderer, this.cssRenderer);

    }

    renderHTML(page, components) {

        return this.htmlRenderer.renderPage({
            title: page ? page.name : "Website Page",
            components: components || (page ? page.components : []),
            styles: this.cssRenderer.render()
        });

    }

    renderPreview(page, components) {

        return this.previewRenderer.renderPreview(page, components);

    }

}

module.exports = Renderer;
