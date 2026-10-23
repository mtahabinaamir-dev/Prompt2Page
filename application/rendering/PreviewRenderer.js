const HTMLRenderer = require("./HTMLRenderer");
const CSSRenderer = require("./CSSRenderer");

class PreviewRenderer {

    constructor(htmlRenderer, cssRenderer) {

        this.htmlRenderer = htmlRenderer || new HTMLRenderer();
        this.cssRenderer = cssRenderer || new CSSRenderer();

    }

    renderPreview(pageModel, components = []) {

        const title = pageModel ? (pageModel.name || "Preview") : "Preview";
        const styles = this.cssRenderer.render();
        const comps = components.length > 0 ? components : (pageModel ? (pageModel.components || []) : []);

        return this.htmlRenderer.renderPage({
            title,
            components: comps,
            styles
        });

    }

}

module.exports = PreviewRenderer;
