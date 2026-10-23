export class ApiService {
    async requestJson(url, options) {
        const response = await fetch(url, options);
        const contentType = response.headers.get("content-type") || "";

        if (!response.ok) {
            throw new Error(`${url} returned ${response.status}`);
        }

        if (!contentType.includes("application/json")) {
            throw new Error(`${url} returned ${contentType || "an unknown content type"} instead of JSON`);
        }

        try {
            return await response.json();
        }
        catch (error) {
            throw new Error(`${url} returned invalid JSON: ${error.message}`);
        }
    }

    async getApplicationState() {
        return this.requestJson("/state");
    }

    async sendCommand(command) {
        return this.requestJson("/command", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ command })
        });
    }

    async uploadImage(fileName, fileData) {
        return this.requestJson("/upload-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fileName, fileData })
        });
    }

    async replaceImage(fileName, fileData) {
        return this.requestJson("/replace-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fileName, fileData })
        });
    }
}
