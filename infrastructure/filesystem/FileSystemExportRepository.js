const fs = require("fs");
const path = require("path");

const ExportJob = require("../../domain/models/ExportJob");

class FileSystemExportRepository {

    getExportsFile(projectId) {

        return path.join(
            process.cwd(),
            "generated",
            "projects",
            projectId,
            "exports.json"
        );

    }

    create(exportJob) {

        const id = exportJob.id || `export-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const job = new ExportJob({
            ...exportJob,
            id,
            status: exportJob.status || "pending",
            createdAt: exportJob.createdAt || new Date()
        });

        if (job.projectId) {

            const file = this.getExportsFile(job.projectId);

            fs.mkdirSync(path.dirname(file), { recursive: true });

            const history = this.findByProjectId(job.projectId);

            history.push(job);

            fs.writeFileSync(
                file,
                JSON.stringify(history.map(j => j.toJSON()), null, 2),
                "utf8"
            );

        }

        return job;

    }

    update(exportJob) {

        if (!exportJob.projectId) {

            return null;

        }

        const history = this.findByProjectId(exportJob.projectId);

        const idx = history.findIndex(j => j.id === exportJob.id);

        if (idx === -1) {

            return this.create(exportJob);

        }

        history[idx] = exportJob;

        const file = this.getExportsFile(exportJob.projectId);

        fs.writeFileSync(
            file,
            JSON.stringify(history.map(j => j.toJSON()), null, 2),
            "utf8"
        );

        return exportJob;

    }

    delete(projectId, id) {

        const history = this.findByProjectId(projectId);

        const filtered = history.filter(j => j.id !== id);

        if (filtered.length === history.length) {

            return false;

        }

        const file = this.getExportsFile(projectId);

        fs.writeFileSync(
            file,
            JSON.stringify(filtered.map(j => j.toJSON()), null, 2),
            "utf8"
        );

        return true;

    }

    findById(projectId, id) {

        const history = this.findByProjectId(projectId);

        return history.find(j => j.id === id) || null;

    }

    findByProjectId(projectId) {

        if (!projectId) return [];

        const file = this.getExportsFile(projectId);

        if (!fs.existsSync(file)) {

            return [];

        }

        try {

            const data = JSON.parse(fs.readFileSync(file, "utf8"));
            return data.map(item => ExportJob.fromJSON(item));

        } catch (error) {

            return [];

        }

    }

    findByStatus(projectId, status) {

        return this.findByProjectId(projectId).filter(job => job.status === status);

    }

    findAll({ projectId } = {}) {

        if (!projectId) return [];

        return this.findByProjectId(projectId);

    }

    exists(projectId, id) {

        return Boolean(this.findById(projectId, id));

    }

}

module.exports = FileSystemExportRepository;