const fs = require("fs");
const path = require("path");

const Project = require("../../domain/models/Project");

class FileSystemProjectRepository {

    constructor() {

        this.rootFolder = path.join(
            process.cwd(),
            "generated"
        );

        this.projectsFolder = path.join(
            this.rootFolder,
            "projects"
        );

        fs.mkdirSync(
            this.projectsFolder,
            { recursive: true }
        );

    }

    getProjectFolder(id) {

        return path.join(
            this.projectsFolder,
            id
        );

    }

    getProjectFile(id) {

        return path.join(
            this.getProjectFolder(id),
            "project.json"
        );

    }

    create(project) {

        const folder =
            this.getProjectFolder(project.id);

        fs.mkdirSync(
            folder,
            { recursive: true }
        );

        const data = {
            id: project.id,
            name: project.name,
            slug: project.slug,
            ownerId: project.ownerId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            designVariants: Array.isArray(project.designVariants) ? project.designVariants : [],
            styleScopes: Array.isArray(project.styleScopes) ? project.styleScopes : [],
            designSeed: Number.isInteger(project.designSeed) ? project.designSeed : null
        };

        fs.writeFileSync(
            this.getProjectFile(project.id),
            JSON.stringify(data, null, 2)
        );

        return Project.fromJSON(data);

    }

    findAll() {

        const folders = fs.readdirSync(
            this.projectsFolder,
            { withFileTypes: true }
        );

        return folders
            .filter(folder => folder.isDirectory())
            .map(folder => this.findById(folder.name))
            .filter(Boolean);

    }

    findById(id) {

        const file =
            this.getProjectFile(id);

        if (!fs.existsSync(file)) {

            return null;

        }

        return Project.fromJSON(
            JSON.parse(
                fs.readFileSync(file, "utf8")
            )
        );

    }

    update(project) {

        const folder = this.getProjectFolder(project.id);

        if (!fs.existsSync(folder)) {
            return null;
        }

        const data = {
            id: project.id,
            name: project.name,
            slug: project.slug,
            ownerId: project.ownerId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            designVariants: Array.isArray(project.designVariants) ? project.designVariants : [],
            styleScopes: Array.isArray(project.styleScopes) ? project.styleScopes : [],
            designSeed: Number.isInteger(project.designSeed) ? project.designSeed : null
        };

        fs.writeFileSync(
            this.getProjectFile(project.id),
            JSON.stringify(data, null, 2)
        );

        return Project.fromJSON(data);

    }

    rename(oldId, newId, updatedProject) {

        const oldFolder = this.getProjectFolder(oldId);
        const newFolder = this.getProjectFolder(newId);

        if (oldId !== newId && fs.existsSync(oldFolder)) {

            fs.renameSync(oldFolder, newFolder);

        } else if (!fs.existsSync(newFolder)) {

            fs.mkdirSync(newFolder, { recursive: true });

        }

        const data = {
            id: updatedProject.id,
            name: updatedProject.name,
            slug: updatedProject.slug,
            ownerId: updatedProject.ownerId,
            createdAt: updatedProject.createdAt,
            updatedAt: updatedProject.updatedAt
        };

        fs.writeFileSync(
            this.getProjectFile(newId),
            JSON.stringify(data, null, 2)
        );

        return Project.fromJSON(data);

    }

    delete(id) {

        const folder = this.getProjectFolder(id);

        if (!fs.existsSync(folder)) {

            return false;

        }

        fs.rmSync(folder, { recursive: true, force: true });

        return true;

    }

}

module.exports = FileSystemProjectRepository;