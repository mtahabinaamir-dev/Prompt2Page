/**
 * AIOrchestrator
 * Single coordinator for the entire AI website generation pipeline.
 *
 * Commands call exactly one method: generateWebsite(prompt, useCases, htmlRenderer)
 *
 * Internal pipeline:
 *   Prompt → NLPEngine → WebsitePlanner → BlueprintResolver → ComponentPlanner → WebsiteGenerator → HTMLRenderer
 */
const NLPEngine = require("../nlp/NLPEngine");
const PlanningWebsitePlanner = require("../planning/WebsitePlanner");
const BlueprintResolver = require("../planning/BlueprintResolver");
const ComponentPlanner = require("../planning/ComponentPlanner");
const WebsiteGenerator = require("./WebsiteGenerator");

class AIOrchestrator {

    constructor(options = {}) {
        // New pipeline dependencies (instantiated lazily if not injected)
        this.nlpEngine = options.nlpEngine || new NLPEngine();
        this.websitePlanner = options.websitePlanner || new PlanningWebsitePlanner();
        this.blueprintResolver = options.blueprintResolver || new BlueprintResolver();
        this.componentPlanner = options.componentPlanner || new ComponentPlanner();
        this.websiteGenerator = options.websiteGenerator || new WebsiteGenerator();
        this.htmlRenderer = options.htmlRenderer || null;
    }

    /**
     * Legacy entry point — delegates to generateWebsite() for backward compatibility.
     */
    orchestrate(prompt, useCases) {
        return this.generateWebsite(prompt, useCases);
    }

    /**
     * Primary public API for AI website generation.
     * Runs the full pipeline and returns a complete response.
     */
    generateWebsite(prompt, useCases, htmlRenderer) {

        if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
            return {
                success: false,
                error: "A valid generation prompt is required."
            };
        }

        const trimmed = prompt.trim();

        // ── Stage 1: NLP ──
        const promptAnalysis = this.nlpEngine.analyze(trimmed);

        // ── Stage 2: Website Planning ──
        const websitePlan = this.websitePlanner.plan(promptAnalysis);

        // ── Stage 3: Blueprint Resolution ──
        const resolvedPlan = this.blueprintResolver.resolve(websitePlan);

        // ── Stage 4: Component Planning ──
        const componentPlan = this.componentPlanner.plan(resolvedPlan);

        // ── Stage 5: Generation ──
        const genResult = this.websiteGenerator.generate(componentPlan, useCases);

        if (!genResult.success) {
            return genResult;
        }

        // ── Stage 6: HTML Rendering ──
        const renderer = htmlRenderer || this.htmlRenderer;
        if (renderer && genResult.project && genResult.project.id) {
            try {
                renderer.render(genResult.project.id);
            } catch (renderError) {
                console.error("HTMLRenderer error:", renderError);
            }
        }

        // ── Stage 7: Response ──
        const projectName = genResult.project ? (genResult.project.name || genResult.project.id) : "Project";
        const pagesCount = genResult.pagesCount || 0;
        const componentsCount = genResult.componentsCount || 0;

        const summary = [
            `Project '${projectName}' created.`,
            `Created ${pagesCount} pages.`,
            `Added ${componentsCount} components.`,
            `Generated HTML.`,
            `Preview updated.`
        ].join("\n");

        return {
            success: true,
            reply: summary,
            project: genResult.project,
            pages: pagesCount,
            components: componentsCount,
            pagesCount,
            componentsCount,
            preview: genResult.project
                ? `/generated/projects/${genResult.project.id}/index.html`
                : null,
            summary
        };

    }

}

module.exports = AIOrchestrator;
