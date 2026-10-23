import { setVisible } from "../utils/dom.js";

const PREVIEW_DEVICE_CLASSES = [
    "preview-device-desktop",
    "preview-device-tablet",
    "preview-device-mobile"
];

const DEVICE_VIEWPORTS = {
    tablet: { width: 768, height: 1024 },
    mobile: { width: 390, height: 844 }
};

export class PreviewManager {
    constructor({ previewPanel, previewPlaceholder, previewLoading, previewFrame, deviceButtons, browserUrl }) {
        this.previewPanel = previewPanel;
        this.previewPlaceholder = previewPlaceholder;
        this.previewLoading = previewLoading;
        this.previewFrame = previewFrame;
        this.deviceButtons = deviceButtons;
        this.browserUrl = browserUrl;
        this.activePage = null;
        this.activeDevice = "desktop";
        this.refreshToken = 0;
        this.browserFrame = previewFrame?.parentElement || null;
    }

    initialize() {
        this.deviceButtons.forEach((button) => {
            button.addEventListener("click", () => {
                this.setDevice(button.dataset.device);
            });
        });

        if (this.browserFrame && typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(() => {
                this.updateViewport();
            });
            this.resizeObserver.observe(this.browserFrame);
        }

        window.addEventListener("resize", () => this.updateViewport());
        this.updateViewport();

        this.showPlaceholder();
    }

    setActivePage(pageName, previewUrl) {
        this.activePage = pageName;
        this.previewUrl = previewUrl || (pageName ? "/preview" : null);

        if (this.browserUrl) {
            this.browserUrl.textContent = this.previewUrl || "No Active Page";
        }
    }

    setDevice(device) {
        if (!device || device === this.activeDevice) return;

        this.activeDevice = device;
        this.previewPanel.classList.remove(...PREVIEW_DEVICE_CLASSES);
        this.previewPanel.classList.add(`preview-device-${device}`);
        this.previewPanel.classList.add("is-switching-device");
        this.updateViewport();

        requestAnimationFrame(() => {
            this.previewPanel.classList.remove("is-switching-device");
        });

        this.deviceButtons.forEach((button) => {
            const isActive = button.dataset.device === device;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    updateViewport() {
        if (!this.previewFrame || !this.browserFrame) return;

        const viewport = DEVICE_VIEWPORTS[this.activeDevice];

        if (!viewport) {
            this.previewFrame.dataset.deviceMode = "desktop";
            this.previewFrame.style.removeProperty("--simulated-width");
            this.previewFrame.style.removeProperty("--simulated-height");
            this.previewFrame.style.removeProperty("--simulated-scale");
            return;
        }

        const availableWidth = this.browserFrame.clientWidth;
        const availableHeight = this.browserFrame.clientHeight;

        if (!availableWidth || !availableHeight) return;

        const scale = Math.min(
            availableWidth / viewport.width,
            availableHeight / viewport.height,
            1
        );

        this.previewFrame.dataset.deviceMode = this.activeDevice;
        this.previewFrame.style.setProperty("--simulated-width", `${viewport.width}px`);
        this.previewFrame.style.setProperty("--simulated-height", `${viewport.height}px`);
        this.previewFrame.style.setProperty("--simulated-scale", String(scale));
    }

    fadeOut() {
        if (!this.previewFrame) return Promise.resolve();

        this.previewFrame.classList.add("is-refreshing");
        this.previewFrame.classList.remove("is-loaded");
        return Promise.resolve();
    }

    reload() {
        if (!this.previewFrame) return Promise.resolve();

        if (!this.activePage) {
            this.showPlaceholder();
            return Promise.resolve();
        }

        this.showLoading();

        return new Promise((resolve, reject) => {
            this.previewFrame.onload = () => resolve();
            this.previewFrame.onerror = () => {
                this.showPlaceholder();
                reject(new Error("Preview iframe failed to load."));
            };
            this.previewFrame.src = `${this.previewUrl}?t=${Date.now()}`;
        });
    }

    fadeIn() {
        this.showFrame();
    }

    async refresh() {
        await this.fadeOut();
        await this.reload();
        this.fadeIn();
    }

    showPlaceholder() {
        setVisible(this.previewPlaceholder, true);
        setVisible(this.previewLoading, false);
        this.previewFrame?.classList.remove("is-loaded");
    }

    showLoading() {
        setVisible(this.previewPlaceholder, false);
        setVisible(this.previewLoading, true);
        this.previewFrame?.classList.add("is-refreshing");
        this.previewFrame?.classList.remove("is-loaded");
    }

    showFrame() {
        if (!this.previewFrame) return;

        setVisible(this.previewPlaceholder, false);
        setVisible(this.previewLoading, false);

        requestAnimationFrame(() => {
            this.previewFrame.classList.remove("is-refreshing");
            this.previewFrame.classList.add("is-loaded");
        });
    }
}
