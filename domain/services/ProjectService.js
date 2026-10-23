const Project = require("../models/Project");
const projectState = require("../../application/state/ProjectState");

function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

class ProjectService {

    constructor(projectRepository) {

        this.projectRepository = projectRepository;

    }

    create(name, ownerId = null) {

        const slug = generateSlug(name);

        const existing =
            this.projectRepository.findById(slug);

        if (existing) {

            return {
                success: false,
                error: "Project already exists."
            };

        }

        const project = new Project({

            id: slug,
            name,
            slug,
            ownerId,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Every new site gets its own design fingerprint, so two sites
            // built from identical prompts don't come out identical.
            designSeed: Math.floor(Math.random() * 1000000)

        });

        const validation = project.validate();

        if (!validation.isValid) {

            return {
                success: false,
                errors: validation.errors
            };

        }

        const saved =
            this.projectRepository.create(project);

        if (!saved) {

            return {
                success: false,
                error: "Failed to create project"
            };

        }

        return {
            success: true,
            project: saved
        };

    }

    rename(id, newName) {

        const existing = this.projectRepository.findById(id);

        if (!existing) {

            return {
                success: false,
                error: "Project not found."
            };

        }

        const newSlug = generateSlug(newName);

        if (!newSlug) {

            return {
                success: false,
                error: "Invalid new project name."
            };

        }

        if (newSlug !== id && this.projectRepository.findById(newSlug)) {

            return {
                success: false,
                error: "A project with this name already exists."
            };

        }

        const updatedProject = new Project({
            id: newSlug,
            name: newName,
            slug: newSlug,
            ownerId: existing.ownerId,
            createdAt: existing.createdAt,
            updatedAt: new Date(),
            designSeed: Number.isInteger(existing.designSeed) ? existing.designSeed : null
        });

        const validation = updatedProject.validate();

        if (!validation.isValid) {

            return {
                success: false,
                errors: validation.errors
            };

        }

        const saved = this.projectRepository.rename(id, newSlug, updatedProject);

        const activeProject = projectState.get();

        if (activeProject && activeProject.id === id) {

            projectState.set(saved);

        }

        return {
            success: true,
            project: saved
        };

    }

    delete(id) {

        const existing = this.projectRepository.findById(id);

        if (!existing) {

            return {
                success: false,
                error: "Project not found."
            };

        }

        const deleted = this.projectRepository.delete(id);

        if (!deleted) {

            return {
                success: false,
                error: "Failed to delete project."
            };

        }

        const activeProject = projectState.get();

        if (activeProject && activeProject.id === id) {

            projectState.set(null);

        }

        return {
            success: true
        };

    }

    switch(id) {

        let project = this.projectRepository.findById(id);

        if (!project) {

            const all = this.projectRepository.findAll();
            project = all.find(p => p.id === id || p.slug === id || p.name.toLowerCase() === id.toLowerCase()) || null;

        }

        if (!project) {

            return {
                success: false,
                error: "Project not found."
            };

        }

        projectState.set(project);

        return {
            success: true,
            project
        };

    }

    list() {

        return this.projectRepository.findAll();

    }

}

module.exports = ProjectService;