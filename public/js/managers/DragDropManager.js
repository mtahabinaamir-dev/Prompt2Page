// Adds drag-and-drop image upload to one or more drop zones (Command
// Center, Media Library). Highlights the zone while a file is dragged
// over it, then hands dropped files to the exact same upload path the
// paperclip button already uses (UploadManager.uploadFiles()) - no
// second upload pipeline, no second "which types are supported" list
// (the backend still owns that and rejects anything it doesn't accept).

export class DragDropManager {
    constructor({ dropZones, uploadManager }) {
        this.dropZones = (dropZones || []).filter(Boolean);
        this.uploadManager = uploadManager;
    }

    initialize() {
        this.dropZones.forEach((zone) => this.wireZone(zone));
    }

    wireZone(zone) {

        // Tracks nested dragenter/dragleave pairs (child elements inside
        // the zone fire their own events) so the highlight only clears
        // once the pointer has actually left the zone, not just moved
        // between its children.
        let dragDepth = 0;

        zone.addEventListener("dragenter", (event) => {

            if (!this.isFileDrag(event)) return;

            event.preventDefault();

            dragDepth += 1;
            zone.classList.add("drag-over");

        });

        zone.addEventListener("dragover", (event) => {

            if (!this.isFileDrag(event)) return;

            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";

        });

        zone.addEventListener("dragleave", (event) => {

            if (!this.isFileDrag(event)) return;

            dragDepth = Math.max(dragDepth - 1, 0);

            if (dragDepth === 0) {
                zone.classList.remove("drag-over");
            }

        });

        zone.addEventListener("drop", (event) => {

            if (!this.isFileDrag(event)) return;

            event.preventDefault();

            dragDepth = 0;
            zone.classList.remove("drag-over");

            const files = Array.from(event.dataTransfer.files || [])
                .filter((file) => file.type.startsWith("image/"));

            if (files.length === 0) return;

            this.uploadManager.uploadFiles(files);

        });

    }

    isFileDrag(event) {

        return Array.from(event.dataTransfer?.types || []).includes("Files");

    }
}
