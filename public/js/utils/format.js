import { escapeHtml } from "./dom.js";

export function formatReply(text) {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/^- (.*)$/gm, "&bull; $1")
        .replace(/\n/g, "<br>");
}

// Presentational-only byte formatting for the Media Library's asset
// cards - mirrors the shape of commands/listAssets.js's server-side
// formatBytes() (used for its chat-reply text) purely for display
// consistency; it doesn't re-derive or duplicate any asset logic, since
// the size value itself always comes from the existing /command response.
export function formatBytes(bytes) {
    if (typeof bytes !== "number" || Number.isNaN(bytes)) return "-";
    if (bytes < 1024) return `${bytes} B`;

    const units = ["KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = -1;

    do {
        value /= 1024;
        unitIndex += 1;
    } while (value >= 1024 && unitIndex < units.length - 1);

    return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDate(isoString) {
    if (!isoString) return "-";

    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}
