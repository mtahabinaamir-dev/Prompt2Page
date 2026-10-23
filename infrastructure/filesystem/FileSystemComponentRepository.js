const fs = require("fs");
const path = require("path");

const Component = require("../../domain/models/Component");

class FileSystemComponentRepository {

    getComponentsFile(projectId, pageId) {

        return path.join(
            process.cwd(),
            "generated",
            "projects",
            projectId,
            "pages",
            pageId,
            "components.json"
        );

    }

    findByPage(projectId, pageId) {

        const file = this.getComponentsFile(projectId, pageId);

        if (!fs.existsSync(file)) {

            return [];

        }

        try {

            const data = JSON.parse(fs.readFileSync(file, "utf8"));
            return data
                .map(item => Component.fromJSON(item))
                .sort((a, b) => a.order - b.order);

        } catch (error) {

            return [];

        }

    }

    saveAll(projectId, pageId, components) {

        const file = this.getComponentsFile(projectId, pageId);
        const folder = path.dirname(file);

        try {

            fs.mkdirSync(folder, { recursive: true });

        } catch (err) {}

        const data = components.map((comp, idx) => {
            comp.order = idx;
            return comp.toJSON();
        });

        try {

            fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");

        } catch (err) {

            try {
                fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
            } catch (e) {}

        }

        return components.map(c => Component.fromJSON(c.toJSON()));

    }

    add(component) {

        const existing = this.findByPage(component.projectId, component.pageId);

        component.order = existing.length;

        existing.push(component);

        this.saveAll(component.projectId, component.pageId, existing);

        return component;

    }

    update(component) {

        const existing = this.findByPage(component.projectId, component.pageId);

        const idx = existing.findIndex(c => c.id === component.id);

        if (idx === -1) {

            return null;

        }

        existing[idx] = component;

        this.saveAll(component.projectId, component.pageId, existing);

        return component;

    }

    delete(projectId, pageId, componentId) {

        const existing = this.findByPage(projectId, pageId);

        const filtered = existing.filter(c => c.id !== componentId);

        if (filtered.length === existing.length) {

            return false;

        }

        this.saveAll(projectId, pageId, filtered);

        return true;

    }

}

module.exports = FileSystemComponentRepository;
