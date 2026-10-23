const express = require("express");
const fs = require("fs");
const path = require("path");

const container = require("./bootstrap/container");

const commands = require("./commands");

const app = express();

// Don't advertise the stack.
app.disable("x-powered-by");

app.use(express.json({ limit: "6mb" }));

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// GET /preview -> Returns rendered HTML for active page/project
app.get("/preview", (req, res) => {

    try {

        const projectState = container.get("ProjectState");
        const pageState = container.get("PageState");
        const pageRepository = container.get("PageRepository");
        const componentRepository = container.get("ComponentRepository");
        const cssRenderer = container.get("CSSRenderer");
        const htmlRenderer = container.get("HTMLRenderer");

        const activeProject = projectState.get();

        if (!activeProject) {

            res.setHeader("Content-Type", "text/html");
            return res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>No Active Project</h2><p>Create or switch to a project to view the live preview.</p></body></html>`);

        }

        let activePage = pageState.get();

        if (activePage && activePage.projectId !== activeProject.id) {

            activePage = null;

        }

        if (!activePage) {

            activePage = pageRepository.getHomepage(activeProject.id) || pageRepository.findByProjectId(activeProject.id)[0];

            if (activePage) {

                pageState.set(activePage);

            }

        }

        if (!activePage) {

            res.setHeader("Content-Type", "text/html");
            return res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>No Active Page</h2><p>Create a page in '${activeProject.name}' to preview it.</p></body></html>`);

        }

        const previewFile = path.join(
            __dirname,
            "generated",
            "projects",
            activeProject.id,
            "pages",
            activePage.id,
            "index.html"
        );

        if (fs.existsSync(previewFile)) {

            return res.sendFile(previewFile);

        }

        const pages = pageRepository.findByProjectId(activeProject.id);
        const components = componentRepository.findByPage(activeProject.id, activePage.id);

        const html = htmlRenderer.renderPage({
            project: activeProject,
            page: activePage,
            pages,
            components,
            styles: cssRenderer.render("", activeProject.designVariants || [], activeProject.styleScopes || [], activeProject.designSeed ?? null)
        });

        res.setHeader("Content-Type", "text/html");
        res.send(html);

    } catch (error) {

        console.error("Preview render error:", error);
        res.status(500).setHeader("Content-Type", "text/html");
        res.send(`<!DOCTYPE html><html><body><h2>Error Rendering Preview</h2><pre>${error.message}</pre></body></html>`);

    }

});

// ---- Media assets -------------------------------------------------
// Images live under generated/projects/<id>/assets/ and are served here.
// Filenames are strictly sanitized: no directories, no traversal.

const ALLOWED_IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function sanitizeAssetName(name) {
    const base = path.basename(String(name || ""));
    const clean = base.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
    return clean.replace(/^\.+/, "");
}

function parseDataUrl(fileData) {
    const m = String(fileData || "").match(/^data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) return null;
    if (!ALLOWED_IMAGE_MIME.has(m[1])) return null;
    let buf;
    try { buf = Buffer.from(m[2], "base64"); } catch { return null; }
    if (!buf.length || buf.length > MAX_UPLOAD_BYTES) return null;
    return { mimeType: m[1], buffer: buf };
}

app.get("/assets/:projectId/:filename", (req, res) => {

    const projectId = sanitizeAssetName(req.params.projectId);

    const filename = sanitizeAssetName(req.params.filename);

    if (!projectId || !filename) return res.status(400).send("Bad request.");

    const folder = path.resolve(process.cwd(), "generated", "projects", projectId, "assets");

    const filePath = path.resolve(folder, filename);

    if (!filePath.startsWith(folder + path.sep) || !fs.existsSync(filePath)) {

        return res.status(404).send("Not found.");

    }

    res.sendFile(filePath);

});

app.post("/upload-image", (req, res) => {

    try {

        const fileName = sanitizeAssetName(req.body && req.body.fileName);

        if (!fileName) return res.status(400).json({ success: false, error: "A file name is required." });

        const parsed = parseDataUrl(req.body && req.body.fileData);

        if (!parsed) {

            return res.status(400).json({
                success: false,
                error: "Only PNG, JPEG, GIF or WebP images up to 5 MB are accepted."
            });

        }

        const result = container.get("AssetUseCase").upload({
            fileName,
            content: parsed.buffer,
            mimeType: parsed.mimeType,
            fileSize: parsed.buffer.length,
        });

        if (!result.success) {

            return res.status(400).json({ success: false, error: result.error || "Upload failed." });

        }

        res.json({ success: true, asset: result.asset });

    } catch (error) {

        console.error(error);

        res.status(500).json({ success: false, error: error.message });

    }

});

app.post("/replace-image", (req, res) => {

    try {

        const fileName = sanitizeAssetName(req.body && req.body.fileName);

        if (!fileName) return res.status(400).json({ success: false, error: "A file name is required." });

        const parsed = parseDataUrl(req.body && req.body.fileData);

        if (!parsed) {

            return res.status(400).json({
                success: false,
                error: "Only PNG, JPEG, GIF or WebP images up to 5 MB are accepted."
            });

        }

        const result = container.get("AssetUseCase").replace({
            fileName,
            content: parsed.buffer,
            mimeType: parsed.mimeType,
        });

        if (!result.success) {

            return res.status(400).json({ success: false, error: result.error || "Replace failed." });

        }

        res.json({ success: true, asset: result.asset });

    } catch (error) {

        console.error(error);

        res.status(500).json({ success: false, error: error.message });

    }

});

// GET /export-zip -> Builds a ZIP of the active project and downloads it.
app.get("/export-zip", async (req, res) => {

    try {

        const result = await commands.export.zip({});

        if (!result.success) {

            return res.status(400).json({ success: false, error: result.error || result.reply });

        }

        const zipPath = result.data && result.data.exportPath
            ? path.resolve(result.data.exportPath)
            : null;

        if (!zipPath) {

            return res.status(500).json({ success: false, error: "Export did not produce a file." });

        }

        const exportsDir = path.resolve(process.cwd(), "exports");

        if (!zipPath.startsWith(exportsDir + path.sep) || !fs.existsSync(zipPath)) {

            return res.status(500).json({ success: false, error: "Export file not found." });

        }

        res.download(zipPath);

    } catch (error) {

        console.error(error);

        res.status(500).json({ success: false, error: error.message });

    }

});

// GET /export-platform/:platform -> Prepares a platform-ready folder
// (github-pages | netlify | vercel), zips it and downloads it.
app.get("/export-platform/:platform", async (req, res) => {

    const platform = String(req.params.platform || "").toLowerCase();

    if (!["github-pages", "netlify", "vercel"].includes(platform)) {

        return res.status(400).json({ success: false, error: "Unknown platform." });

    }

    try {

        const exportCommands = require("./commands/export");

        const prep = container.get("ExportUseCase").exportPlatform({ platform });

        if (!prep.success) {

            return res.status(400).json({ success: false, error: prep.error });

        }

        const folder = path.resolve(prep.exportPath);

        const exportsDir = path.resolve(process.cwd(), "exports");

        if (!folder.startsWith(exportsDir + path.sep)) {

            return res.status(500).json({ success: false, error: "Invalid export path." });

        }

        const archiver = require("archiver");

        const zipPath = path.join(path.dirname(folder), `${platform}.zip`);

        await new Promise((resolve, reject) => {

            const output = fs.createWriteStream(zipPath);

            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", resolve);

            archive.on("error", reject);

            archive.pipe(output);

            archive.directory(folder, false);

            archive.finalize();

        });

        res.download(zipPath, `${platform}.zip`);

    } catch (error) {

        console.error(error);

        res.status(500).json({ success: false, error: error.message });

    }

});

// GET /state -> Returns application state
app.get("/state", (req, res) => {

    try {

        const projectState = container.get("ProjectState");
        const pageState = container.get("PageState");
        const conversationState = container.get("ConversationState");
        const historyState = container.get("HistoryState");
        const projectRepo = container.get("ProjectRepository");
        const pageRepo = container.get("PageRepository");

        let activeProject = projectState.get();
        let activePage = pageState.get();

        if (activePage && (!activeProject || activePage.projectId !== activeProject.id)) {

            activePage = null;

        }

        if (!activePage && activeProject) {

            try {

                activePage = pageRepo.getHomepage(activeProject.id) || pageRepo.findByProjectId(activeProject.id)[0] || null;

                if (activePage) {

                    pageState.set(activePage);

                }

            } catch (err) {}

        }

        // Rehydrate a stub active project left by a server restart.
        if (activeProject && activeProject._restored) {

            try {

                const full = projectRepo.findById(activeProject.id);

                if (full) {

                    projectState.set(full);

                    activeProject = full;

                }

            } catch (err) {}

        }

        const activeProjectName = activeProject ? (activeProject.name || activeProject.id) : null;
        const activePageName = activePage ? (activePage.name || activePage.id) : null;

        let projects = [];
        let pages = [];
        const previewUrl = "/preview";

        try {

            projects = projectRepo.findAll().map(p => p.name || p.id);

        } catch (err) {}

        if (activeProject) {

            try {

                pages = pageRepo.findByProjectId(activeProject.id).map(p => p.name || p.id);

            } catch (err) {}

        }

        res.json({
            activeProject: activeProjectName,
            activePage: activePageName,
            projects,
            pages,
            previewUrl,
            project: activeProject,
            page: activePage,
            conversation: conversationState.get(),
            history: historyState.get()
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

// ---- Rate limiting ------------------------------------------------
// Simple in-memory sliding window: 30 /command requests per IP per minute.
// Generous for humans, stops runaway scripts from melting the server.

const rateBuckets = new Map();

function rateLimit(req, res, next) {

    const key = req.ip || "unknown";
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxHits = 30;

    let bucket = rateBuckets.get(key);

    if (!bucket || now - bucket.start > windowMs) {

        bucket = { start: now, hits: 0 };
        rateBuckets.set(key, bucket);

    }

    bucket.hits++;

    if (bucket.hits > maxHits) {

        return res.status(429).json({
            success: false,
            reply: "Whoa, slow down a little — too many requests. Try again in a minute.",
            error: "Rate limit exceeded."
        });

    }

    // Prune stale buckets so the map can't grow forever.
    if (rateBuckets.size > 1000) {

        for (const [k, b] of rateBuckets) {

            if (now - b.start > windowMs) rateBuckets.delete(k);

        }

    }

    next();

}

app.post("/command", rateLimit, async (req, res) => {

    const raw = req.body && typeof req.body.command === "string" ? req.body.command : "";

    const input = raw.length > 10000 ? "" : raw;

    try {

        const result = await container.get("IntentRouter").route(input, raw.length > 10000);

        console.log("Result:", result && result.reply);

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});

if (require.main === module) {

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {

        console.log(`Server running on http://localhost:${PORT}`);

    });

}

module.exports = app;
