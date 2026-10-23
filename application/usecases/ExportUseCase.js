class ExportUseCase {

    constructor(exportService) {

        this.exportService = exportService;

    }

    exportHTML(data = {}) {

        return this.exportService.exportHTML();

    }

    async exportZIP(data = {}) {

        return await this.exportService.exportZIP();

    }

    exportPlatform(data = {}) {

        const platform = data.platform || data.type || data.target;

        if (!platform || typeof platform !== "string" || !platform.trim()) {

            return {
                success: false,
                error: "Platform name (github-pages, netlify, vercel) is required"
            };

        }

        return this.exportService.preparePlatformExport(platform.trim().toLowerCase());

    }

    history(data = {}) {

        const result = this.exportService.getExportHistory();

        if (Array.isArray(result)) {

            return {
                success: true,
                history: result
            };

        }

        return result;

    }

}

module.exports = ExportUseCase;
