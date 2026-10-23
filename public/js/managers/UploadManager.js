// Wires the paperclip button beside the command input to the hidden
// native file input, so clicking it opens the OS file picker, and owns
// the actual upload flow (readFileAsDataUrl -> POST /upload-image ->
// notify -> refresh Media Library) so there is exactly one upload path.
// DragDropManager reuses uploadFiles() below for dropped files rather
// than talking to the API a second way.

import { readFileAsDataUrl } from "../utils/file.js";

export class UploadManager {
    constructor({ uploadButton, fileInput, apiService, uiManager, onUploaded }) {
        this.uploadButton = uploadButton;
        this.fileInput = fileInput;
        this.apiService = apiService;
        this.uiManager = uiManager;
        this.onUploaded = onUploaded;
    }

    initialize() {
        this.initializeEvents();
    }

    initializeEvents() {
        this.uploadButton.addEventListener("click", () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener("change", () => {
            this.handleFilesSelected();
        });
    }

    handleFilesSelected() {
        const files = Array.from(this.fileInput.files || []);

        // Allow selecting the same file(s) again later.
        this.fileInput.value = "";

        if (files.length === 0) return;

        this.uploadFiles(files);
    }

    // Uploads each file to the existing /upload-image endpoint (the
    // backend already stores it inside the active project's media
    // folder and rejects unsupported types) - shared by the paperclip
    // button/native picker flow above and DragDropManager.
    async uploadFiles(files) {

        for (const file of files) {

            try {

                const fileData = await readFileAsDataUrl(file);
                const result = await this.apiService.uploadImage(file.name, fileData);

                if (result.success) {

                    this.uiManager.addAssistantMessage(`\u2713 Uploaded ${file.name}`);

                    this.onUploaded?.();

                }
                else {

                    this.uiManager.addAssistantMessage(result.reply || `Failed to upload ${file.name}`);

                }

            }
            catch (error) {

                this.uiManager.addAssistantMessage(`Failed to upload ${file.name}`);

            }

        }

    }
}
