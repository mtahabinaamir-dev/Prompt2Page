const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(process.cwd(), "generated", "active-project.json");

class ProjectState {

    constructor() {
        this.activeProject = null;
        this._restore();
    }

    _restore() {

        try {

            if (fs.existsSync(STATE_FILE)) {

                const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));

                if (data && data.projectId) {

                    // The full project object is rehydrated lazily on next
                    // access; the id alone is enough to survive a restart.
                    this.activeProject = { id: data.projectId, _restored: true };

                }

            }

        } catch (e) { /* start fresh */ }

    }

    _persist() {

        try {

            fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });

            if (this.activeProject && this.activeProject.id) {

                fs.writeFileSync(STATE_FILE, JSON.stringify({ projectId: this.activeProject.id }));

            } else if (fs.existsSync(STATE_FILE)) {

                fs.unlinkSync(STATE_FILE);

            }

        } catch (e) { /* non-fatal */ }

    }

    set(project) {
        this.activeProject = project;
        this._persist();
    }

    get() {
        return this.activeProject;
    }

    clear() {
        this.activeProject = null;
        this._persist();
    }

}

module.exports = new ProjectState();
