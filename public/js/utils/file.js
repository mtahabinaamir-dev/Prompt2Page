// Reads a selected file as a data URL (base64) - the same shape
// server.js's /upload-image and /replace-image routes (and their shared
// decodeFileData() helper in commands/uploadImage.js) already expect for
// fileData. Shared by both the chat upload flow (app.js) and the Media
// Library's Replace action (MediaLibraryManager.js) so the same file
// isn't read two different ways in two different places.
export function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(file);
    });
}
