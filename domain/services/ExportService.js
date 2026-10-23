const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const ExportJob = require("../models/ExportJob");
const projectState = require("../../application/state/ProjectState");

class ExportService {

    constructor(exportRepository, pageRepository, assetRepository, projectRepository) {

        this.exportRepository = exportRepository;
        this.pageRepository = pageRepository;
        this.assetRepository = assetRepository;
        this.projectRepository = projectRepository;

    }

    getActiveProject() {

        let project = projectState.get();

        // After a server restart the active project is an id stub —
        // rehydrate so exports see designVariants/styleScopes (the
        // preview route and IntentRouter already do this).
        if (project && project._restored && this.projectRepository) {

            try {

                const full = this.projectRepository.findById(project.id);

                if (full) {

                    projectState.set(full);

                    project = full;

                }

            } catch { /* fall through with the stub */ }

        }

        return project;

    }

    exportHTML() {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        const exportPath = path.join(process.cwd(), "exports", activeProject.id, "html");

        fs.mkdirSync(exportPath, { recursive: true });

        const pages = this.pageRepository ? this.pageRepository.findByProjectId(activeProject.id) : [];

        if (pages.length === 0) {

            const indexFile = path.join(exportPath, "index.html");

            fs.writeFileSync(
                indexFile,
                `<!DOCTYPE html>\n<html>\n<head><title>${activeProject.name}</title></head>\n<body>\n<h1>${activeProject.name}</h1>\n</body>\n</html>`,
                "utf8"
            );

        } else {

            pages.forEach(page => {

                const fileName = page.isHomepage ? "index.html" : `${page.id}.html`;

                // Uploaded images are served at /assets/<projectId>/… while
                // live; in the static export they sit next to the HTML.
                // The cached page.html carries no stylesheet or SEO tags, so
                // inject them for parity with the preview.
                const { escapeHtml } = require("../../application/utils/escapeHtml");
                const pageTitle = escapeHtml(page.seoTitle || `${page.name || page.id} - ${activeProject.name || activeProject.id}`);
                const metaDesc = escapeHtml(String(page.seoDescription || `${activeProject.name || activeProject.id} - ${page.name || page.id}`).slice(0, 160));
                const initial = escapeHtml(String(activeProject.name || "W").trim().charAt(0).toUpperCase());
                const favicon = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#3182ce"/><text x="32" y="44" font-size="36" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold">${initial}</text></svg>`)}`;
                const seoHead = `<link rel="stylesheet" href="styles.css">` +
                    `<meta name="description" content="${metaDesc}">` +
                    `<meta property="og:title" content="${pageTitle}">` +
                    `<meta property="og:description" content="${metaDesc}">` +
                    `<link rel="icon" href="${favicon}">`;
                const html = String(page.html || "")
                    .split(`/assets/${activeProject.id}/`).join("assets/")
                    .replace(/<head>/i, `<head>${seoHead}`)
                    .replace(/<title>[^<]*<\/title>/i, `<title>${pageTitle}</title>`);

                fs.writeFileSync(
                    path.join(exportPath, fileName),
                    html,
                    "utf8"
                );

            });

            // Ship the design-system stylesheet alongside the pages so the
            // export looks like the preview (cards, tabs, forms, gallery…).
            try {
                const CSSRenderer = require("../../application/rendering/CSSRenderer");
                fs.writeFileSync(
                    path.join(exportPath, "styles.css"),
                    new CSSRenderer().render("", activeProject.designVariants || [], activeProject.styleScopes || [], activeProject.designSeed ?? null),
                    "utf8"
                );
            } catch (e) { console.error("Export stylesheet failed:", e.message); }

        }

        const assets = this.assetRepository ? this.assetRepository.findByProjectId(activeProject.id) : [];

        if (assets.length > 0) {

            const assetsExportFolder = path.join(exportPath, "assets");

            fs.mkdirSync(assetsExportFolder, { recursive: true });

            assets.forEach(asset => {

                if (fs.existsSync(asset.filePath)) {

                    fs.copyFileSync(
                        asset.filePath,
                        path.join(assetsExportFolder, asset.fileName)
                    );

                }

            });

        }

        const job = new ExportJob({
            id: `export-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            projectId: activeProject.id,
            exportType: "html",
            status: "completed",
            exportPath,
            projectName: activeProject.name,
            filename: "index.html",
            createdAt: new Date(),
            completedAt: new Date()
        });

        this.exportRepository.create(job);

        return {
            success: true,
            exportPath,
            job
        };

    }

    async exportZIP() {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        const htmlRes = this.exportHTML();

        if (!htmlRes.success) {

            return htmlRes;

        }

        const zipPath = path.join(process.cwd(), "exports", activeProject.id, `${activeProject.id}.zip`);

        fs.mkdirSync(path.dirname(zipPath), { recursive: true });

        await new Promise((resolve, reject) => {

            const output = fs.createWriteStream(zipPath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", resolve);
            archive.on("error", reject);

            archive.pipe(output);
            archive.directory(htmlRes.exportPath, false);
            archive.finalize();

        });

        const job = new ExportJob({
            id: `export-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            projectId: activeProject.id,
            exportType: "zip",
            status: "completed",
            exportPath: zipPath,
            projectName: activeProject.name,
            filename: `${activeProject.id}.zip`,
            createdAt: new Date(),
            completedAt: new Date()
        });

        this.exportRepository.create(job);

        return {
            success: true,
            exportPath: zipPath,
            job
        };

    }

    preparePlatformExport(platform) {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        const allowedPlatforms = ["github-pages", "netlify", "vercel"];

        if (!platform || !allowedPlatforms.includes(platform.toLowerCase())) {

            return {
                success: false,
                error: `Unsupported platform: '${platform}'. Supported platforms: github-pages, netlify, vercel.`
            };

        }

        const plat = platform.toLowerCase();

        const htmlRes = this.exportHTML();

        if (!htmlRes.success) {

            return htmlRes;

        }

        const platformExportPath = path.join(process.cwd(), "exports", activeProject.id, plat);

        fs.mkdirSync(platformExportPath, { recursive: true });

        // Copy all files from html export folder into platform folder
        const copyDir = (src, dest) => {

            fs.mkdirSync(dest, { recursive: true });

            const entries = fs.readdirSync(src, { withFileTypes: true });

            for (const entry of entries) {

                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);

                if (entry.isDirectory()) {

                    copyDir(srcPath, destPath);

                } else {

                    fs.copyFileSync(srcPath, destPath);

                }

            }

        };

        copyDir(htmlRes.exportPath, platformExportPath);

        // Write platform-specific configuration stubs
        if (plat === "netlify") {

            fs.writeFileSync(
                path.join(platformExportPath, "netlify.toml"),
                "[build]\n  publish = \".\"\n",
                "utf8"
            );

        } else if (plat === "vercel") {

            fs.writeFileSync(
                path.join(platformExportPath, "vercel.json"),
                JSON.stringify({ version: 2, cleanUrls: true }, null, 2),
                "utf8"
            );

        } else if (plat === "github-pages") {

            fs.writeFileSync(
                path.join(platformExportPath, ".nojekyll"),
                "",
                "utf8"
            );

        }

        const job = new ExportJob({
            id: `export-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            projectId: activeProject.id,
            exportType: plat,
            status: "completed",
            exportPath: platformExportPath,
            projectName: activeProject.name,
            filename: plat,
            createdAt: new Date(),
            completedAt: new Date()
        });

        this.exportRepository.create(job);

        return {
            success: true,
            platform: plat,
            exportPath: platformExportPath,
            job,
            message: `Architecture prepared for ${plat}. Cloud deployment not implemented yet.`
        };

    }

    getExportHistory() {

        const activeProject = this.getActiveProject();

        if (!activeProject) {

            return {
                success: false,
                error: "No active project selected. Please switch to or create a project first."
            };

        }

        return this.exportRepository.findByProjectId(activeProject.id);

    }

}

module.exports = ExportService;