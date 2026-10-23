// Media Library view: lists the active project's uploaded assets and
// wires Rename/Delete/Replace actions. Deliberately reuses the existing
// backend surface end-to-end rather than adding any new asset logic:
//   - listing   -> apiService.sendCommand("list assets")       (LIST_ASSETS)
//   - rename    -> apiService.sendCommand("rename asset ... to ...") (RENAME_ASSET)
//   - delete    -> apiService.sendCommand("delete asset ...")  (DELETE_ASSET)
//   - replace   -> apiService.replaceImage(fileName, fileData) (/replace-image, REPLACE_ASSET)
// The exact same commands a user could type into the Command Center.

import { escapeHtml, setVisible } from "../utils/dom.js";
import { formatBytes, formatDate } from "../utils/format.js";
import { readFileAsDataUrl } from "../utils/file.js";

// Appends a cache-busting query param to an asset URL so a Replace (same
// fileName, new bytes) is never served stale from the browser's HTTP
// cache. `version` is the asset's own modifiedAt, so unrelated/unchanged
// assets keep their existing cache behavior untouched.
function withCacheBust(url, version) {
    if (!url) return url || "";

    const separator = url.includes("?") ? "&" : "?";

    return `${url}${separator}v=${encodeURIComponent(version || Date.now())}`;
}

export class MediaLibraryManager {
    constructor({
        apiService,
        uiManager,
        viewManager,
        dashboardView,
        mediaLibraryView,
        grid,
        placeholder,
        noResults,
        searchInput,
        replaceFileInput
    }) {
        this.apiService = apiService;
        this.uiManager = uiManager;
        this.viewManager = viewManager;
        this.dashboardView = dashboardView;
        this.mediaLibraryView = mediaLibraryView;
        this.grid = grid;
        this.placeholder = placeholder;
        this.noResults = noResults;
        this.searchInput = searchInput;
        this.replaceFileInput = replaceFileInput;
        this.pendingReplaceFileName = null;
        this.assets = [];
    }

    initialize() {
        this.replaceFileInput?.addEventListener("change", () => {
            this.handleReplaceFileSelected();
        });

        // Filters the already-loaded asset list client-side rather than
        // re-querying the backend per keystroke - list assets is already
        // a full, cheap fetch, so there's nothing worth debouncing/caching
        // beyond just keeping the last response around (see this.assets).
        this.searchInput?.addEventListener("input", () => {
            this.applyFilter();
        });
    }

    // Clears "active" off every sidebar nav button, then applies it only
    showDashboard() {
        this.viewManager?.show("dashboardView");
    }

    showMediaLibrary() {
        this.viewManager?.show("mediaLibraryView");
        this.load();
    }

    showLoading() {
        setVisible(this.placeholder, false);
        this.grid.innerHTML = "";

        for (let index = 0; index < 4; index++) {

            const card = document.createElement("div");

            card.className = "asset-card asset-card-skeleton";
            // Reuses UIManager's existing skeleton markup rather than a
            // second copy of the same loading-placeholder HTML.
            card.innerHTML = this.uiManager.getSkeletonMarkup();

            this.grid.appendChild(card);

        }
    }

    async load() {
        this.showLoading();

        try {

            const data = await this.apiService.sendCommand("list assets");

            this.render(data?.data?.assets || []);

        }
        catch (error) {

            this.render([]);

        }
    }

    // Called after any successful upload (paperclip button, drag & drop
    // onto Command Center, or drag & drop onto Media Library itself) so
    // the visible grid reflects the new asset immediately rather than
    // only refreshing the next time the Media Library is opened.
    refresh() {
        this.load();
    }

    render(assets) {
        this.assets = assets || [];
        this.applyFilter();
    }

    // Splits "no assets at all" from "assets exist but none match the
    // search" - the former shows the upload-focused empty state
    // (mediaLibraryPlaceholder), the latter shows a plain
    // no-results message (mediaLibraryNoResults) instead, since offering
    // an "Upload Image" button there would be misleading when assets do
    // exist, just not under this search term.
    applyFilter() {
        const term = (this.searchInput?.value || "").trim().toLowerCase();

        const filtered = term
            ? this.assets.filter((asset) => asset.fileName.toLowerCase().includes(term))
            : this.assets;

        this.renderGrid(filtered);
    }

    renderGrid(filteredAssets) {
        this.grid.innerHTML = "";

        if (this.assets.length === 0) {
            setVisible(this.placeholder, true);
            setVisible(this.noResults, false);
            return;
        }

        setVisible(this.placeholder, false);

        if (filteredAssets.length === 0) {
            setVisible(this.noResults, true);
            return;
        }

        setVisible(this.noResults, false);

        filteredAssets.forEach((asset) => {
            this.grid.appendChild(this.buildCard(asset));
        });
    }

    buildCard(asset) {
        const card = document.createElement("div");

        card.className = "asset-card";

        const dimensionsLabel = asset.dimensions
            ? `${asset.dimensions.width} \u00d7 ${asset.dimensions.height}`
            : null;

        // Replace (and rename) keep the same fileName/URL, so the browser's
        // HTTP cache has no reason to know the bytes behind that URL just
        // changed - it'll happily serve the old cached image forever.
        // Appending the file's own modifiedAt as a query param forces a
        // fresh request whenever the file actually changes, while leaving
        // untouched assets (same modifiedAt) free to keep using the cache.
        const thumbnailSrc = withCacheBust(asset.url, asset.modifiedAt);

        card.innerHTML = `
            <div class="asset-thumb">
                <img src="${escapeHtml(thumbnailSrc)}" alt="${escapeHtml(asset.fileName)}" loading="lazy">
            </div>
            <div class="asset-info">
                <h4 class="asset-name" title="${escapeHtml(asset.fileName)}">${escapeHtml(asset.fileName)}</h4>
                <div class="asset-meta">
                    ${dimensionsLabel ? `<span>${escapeHtml(dimensionsLabel)}</span>` : ""}
                    <span>${escapeHtml(formatBytes(asset.size))}</span>
                    <span>${escapeHtml(formatDate(asset.createdAt))}</span>
                </div>
            </div>
            <div class="asset-actions">
                <button type="button" class="asset-action-btn" data-action="rename">Rename</button>
                <button type="button" class="asset-action-btn" data-action="replace">Replace</button>
                <button type="button" class="asset-action-btn asset-action-danger" data-action="delete">Delete</button>
            </div>
        `;

        card.querySelector('[data-action="rename"]').addEventListener("click", () => {
            this.handleRename(asset);
        });

        card.querySelector('[data-action="replace"]').addEventListener("click", () => {
            this.handleReplace(asset);
        });

        card.querySelector('[data-action="delete"]').addEventListener("click", () => {
            this.handleDelete(asset);
        });

        return card;
    }

    async handleRename(asset) {
        const input = window.prompt(`Rename "${asset.fileName}" to:`, asset.fileName);

        if (!input) return;

        const newName = input.trim();

        if (newName === "" || newName === asset.fileName) return;

        const result = await this.apiService.sendCommand(
            `rename asset ${asset.fileName} to ${newName}`
        );

        this.uiManager.addAssistantMessage(result.reply || `Unable to rename "${asset.fileName}".`);

        if (result.success) {
            this.load();
        }
    }

    async handleDelete(asset) {
        const confirmed = window.confirm(`Delete "${asset.fileName}"? This can't be undone.`);

        if (!confirmed) return;

        const result = await this.apiService.sendCommand(
            `delete asset ${asset.fileName}`
        );

        this.uiManager.addAssistantMessage(result.reply || `Unable to delete "${asset.fileName}".`);

        if (result.success) {
            this.load();
        }
    }

    handleReplace(asset) {
        this.pendingReplaceFileName = asset.fileName;
        this.replaceFileInput.click();
    }

    async handleReplaceFileSelected() {
        const file = this.replaceFileInput.files?.[0];
        const fileName = this.pendingReplaceFileName;

        // Allow selecting the same file again later.
        this.replaceFileInput.value = "";
        this.pendingReplaceFileName = null;

        if (!file || !fileName) return;

        try {

            const fileData = await readFileAsDataUrl(file);
            const result = await this.apiService.replaceImage(fileName, fileData);

            this.uiManager.addAssistantMessage(result.reply || `Unable to replace "${fileName}".`);

            if (result.success) {
                // Update the specific asset in the local array with the returned metadata
                // (includes new modifiedAt for cache-busting, new size, new dimensions)
                if (result.data?.replacedFile) {
                    const index = this.assets.findIndex(a => a.fileName === fileName);
                    if (index !== -1) {
                        this.assets[index] = result.data.replacedFile;
                        this.render(this.assets);
                    }
                } else {
                    // Fallback to full reload if metadata not returned
                    this.load();
                }
            }

        }
        catch (error) {

            this.uiManager.addAssistantMessage(`Unable to replace "${fileName}".`);

        }
    }
}
