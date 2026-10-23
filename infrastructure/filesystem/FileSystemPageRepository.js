const fs = require("fs");
const path = require("path");

const Page = require("../../domain/models/Page");

class FileSystemPageRepository {

    getPageFile(projectId, pageId) {

        return path.join(
            process.cwd(),
            "generated",
            "projects",
            projectId,
            "pages",
            `${pageId}.json`
        );

    }

    findByProjectId(projectId) {

        const dir = path.join(
            process.cwd(),
            "generated",
            "projects",
            projectId,
            "pages"
        );

        if (!fs.existsSync(dir)) {

            return [];

        }

        try {

            const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));

            return files.map((file) => {

                const fullPath = path.join(dir, file);
                const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
                return Page.fromJSON(data);

            });

        } catch (error) {

            return [];

        }

    }

    findById(projectId, pageId) {

        const file = this.getPageFile(projectId, pageId);

        if (!fs.existsSync(file)) {

            return null;

        }

        try {

            const data = JSON.parse(fs.readFileSync(file, "utf8"));
            return Page.fromJSON(data);

        } catch (error) {

            return null;

        }

    }

    getHomepage(projectId) {

        const pages = this.findByProjectId(projectId);

        return pages.find(p => p.isHomepage) || null;

    }

    save(page) {

        const file = this.getPageFile(page.projectId, page.id);
        const folder = path.dirname(file);

        try {

            fs.mkdirSync(folder, { recursive: true });

        } catch (err) {}

        try {

            fs.writeFileSync(file, JSON.stringify(page.toJSON(), null, 2), "utf8");

        } catch (err) {

            try {
                fs.writeFileSync(file, JSON.stringify(page.toJSON(), null, 2), "utf8");
            } catch (e) {}

        }

        return page;

    }

    create(page) {

        return this.save(page);

    }

    update(page) {

        return this.save(page);

    }

    rename(projectId, oldId, newId, updatedPage) {

        const oldFile = this.getPageFile(projectId, oldId);

        if (updatedPage && typeof updatedPage === "object" && typeof updatedPage.toJSON === "function") {

            this.save(updatedPage);

            if (oldId !== newId && fs.existsSync(oldFile)) {

                try {
                    fs.unlinkSync(oldFile);
                } catch (err) {}

            }

            return updatedPage;

        }

        const page = this.findById(projectId, oldId);

        if (!page) {

            return null;

        }

        page.id = newId;
        page.name = newId;

        this.save(page);

        if (oldId !== newId && fs.existsSync(oldFile)) {

            try {
                fs.unlinkSync(oldFile);
            } catch (err) {}

        }

        return page;

    }

    delete(projectId, pageId) {

        const file = this.getPageFile(projectId, pageId);

        if (!fs.existsSync(file)) {

            return false;

        }

        try {

            fs.unlinkSync(file);
            return true;

        } catch (error) {

            return false;

        }

    }

}

module.exports = FileSystemPageRepository;