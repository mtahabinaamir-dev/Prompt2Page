/**
 * WebsiteGenerator
 * Pure executor. Consumes a ComponentPlan and orchestrates UseCases.
 *
 * No planning. No decisions. No business logic. No knowledge files.
 * Simply executes what ComponentPlan describes.
 */
class WebsiteGenerator {

    generate(componentPlan, useCases) {

        if (!useCases || !useCases.projectUseCase || !useCases.pageUseCase || !useCases.componentUseCase) {

            return {
                success: false,
                error: "Required UseCases (projectUseCase, pageUseCase, componentUseCase) must be provided."
            };

        }

        const { projectUseCase, pageUseCase, componentUseCase } = useCases;
        const { projectName = "Generated Project", pages = [] } = componentPlan || {};

        // Template variables like {{business}} appear in knowledge blueprints.
        // Substitute them here so generated pages never leak raw placeholders.
        const templateVars = {
            business: projectName && projectName !== "Generated Project"
                ? projectName
                : this._displayName(componentPlan && componentPlan.business),
            businessType: this._displayName(componentPlan && componentPlan.business),
            year: String(new Date().getFullYear()),
        };

        // STEP 1: Create Project
        const projectRes = projectUseCase.create({ name: projectName });

        if (!projectRes.success) {

            return {
                success: false,
                error: projectRes.reply || projectRes.error || "Failed to create project for generated website."
            };

        }

        const project = (projectRes.data && projectRes.data.project)
            ? projectRes.data.project
            : (projectRes.project || projectRes.data);

        // STEP 2: Switch Project
        projectUseCase.switch({ id: project.id });

        let createdPagesCount = 0;
        let createdComponentsCount = 0;

        // STEP 3: Create Pages
        for (const page of pages) {

            const pageRes = pageUseCase.create({
                name: page.name,
                isHomepage: page.isHomepage
            });

            if (pageRes.success) {

                createdPagesCount++;
                const createdPage = pageRes.page || (pageRes.data && pageRes.data.page);
                const pageId = createdPage ? createdPage.id : this._slug(page.name);

                // STEP 4: Switch Page
                pageUseCase.switch({ id: pageId });

                // STEP 5: Create Components
                for (const component of (page.components || [])) {

                    const compRes = componentUseCase.add({
                        pageId,
                        type: component.type,
                        section: component.section || null,
                        content: this._substitute(component.content || component.asset || component.label || "", templateVars),
                        level: component.properties?.level,
                        alt: this._substitute(component.properties?.alt || component.asset || "", templateVars),
                        // Forward the full properties object — ComponentPlanner preserves
                        // it and ComponentUseCase/Component/HTMLRenderer all consume it.
                        // A defensive copy avoids mutating the plan's object downstream.
                        properties: component.properties && typeof component.properties === "object"
                            ? { ...component.properties }
                            : {}
                    });

                    if (compRes.success) {
                        createdComponentsCount++;
                    }

                }

            }

        }

        return {
            success: true,
            project,
            pagesCount: createdPagesCount,
            componentsCount: createdComponentsCount
        };

    }

    _slug(name) {
        return String(name).toLowerCase().replace(/[^a-z0-9-_]/g, "");
    }

    _displayName(business) {
        const b = String(business || "general").trim() || "general";
        return b.charAt(0).toUpperCase() + b.slice(1);
    }

    _substitute(text, vars) {
        return String(text == null ? "" : text).replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) =>
            vars[key] !== undefined ? vars[key] : m
        );
    }

}

module.exports = WebsiteGenerator;
