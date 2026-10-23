class ComponentUseCase {

    constructor(componentService) {

        this.componentService = componentService;

    }

    add(data) {

        if (!data || !data.type || typeof data.type !== "string" || !data.type.trim()) {

            return {
                success: false,
                error: "Component type is required"
            };

        }

        return this.componentService.add({
            pageId: data.pageId,
            type: data.type.trim().toLowerCase(),
            content: data.content || "",
            level: data.level,
            alt: data.alt,
            section: data.section || null,
            properties: data.properties || {}
        });

    }

    edit(data) {

        if (!data || (!data.componentId && typeof data.index !== "number")) {

            return {
                success: false,
                error: "Component ID or index is required for edit"
            };

        }

        return this.componentService.edit({
            pageId: data.pageId,
            componentId: data.componentId,
            index: data.index,
            content: data.content,
            level: data.level,
            alt: data.alt,
            styles: data.styles
        });

    }

    delete(data) {

        if (!data || (!data.componentId && typeof data.index !== "number")) {

            return {
                success: false,
                error: "Component ID or index is required for delete"
            };

        }

        return this.componentService.delete({
            pageId: data.pageId,
            componentId: data.componentId,
            index: data.index
        });

    }

    move(data) {

        if (!data || (!data.componentId && typeof data.fromIndex !== "number")) {

            return {
                success: false,
                error: "Component ID or fromIndex is required for move"
            };

        }

        return this.componentService.move({
            pageId: data.pageId,
            componentId: data.componentId,
            fromIndex: data.fromIndex,
            toIndex: data.toIndex,
            direction: data.direction
        });

    }

}

module.exports = ComponentUseCase;