// Owns sidebar navigation: exactly one view visible at a time, exactly one
// nav button highlighted. Views register themselves by id; the manager
// maps nav buttons (via data-view) to view sections (via matching id).

function setVisible(el, visible, display = "flex") {
    if (!el) return;
    if (visible) {
        el.hidden = false;
        el.style.display = display;
    } else {
        el.hidden = true;
        el.style.display = "none";
    }
}

export class ViewManager {
    constructor({ navButtons, views, onShow }) {
        this.navButtons = navButtons || [];
        this.views = views || {};       // { viewId: element }
        this.onShow = onShow || {};     // { viewId: () => void }
        this.activeView = null;
    }

    initialize() {
        this.navButtons.forEach((button) => {
            const viewId = button.dataset.view;
            if (!viewId || !this.views[viewId]) return;
            button.addEventListener("click", () => this.show(viewId));
        });
    }

    show(viewId) {
        if (!this.views[viewId]) return;
        this.activeView = viewId;

        this.navButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.view === viewId);
        });

        for (const [id, el] of Object.entries(this.views)) {
            setVisible(el, id === viewId);
        }

        if (typeof this.onShow[viewId] === "function") {
            this.onShow[viewId]();
        }
    }

    current() {
        return this.activeView;
    }
}
