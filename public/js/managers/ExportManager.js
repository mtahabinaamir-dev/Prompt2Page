export class ExportManager {
    constructor({ uiManager }) {
        this.uiManager = uiManager;
        this.exportButtons = null;
        this.isExporting = false;
    }

    initialize(exportButton, githubExportButton, netlifyExportButton, vercelExportButton) {
        this.exportButtons = {
            export: exportButton,
            github: githubExportButton,
            netlify: netlifyExportButton,
            vercel: vercelExportButton
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.exportButtons.export) {
            this.exportButtons.export.addEventListener('click', () => this.handleExport('zip'));
        }
        if (this.exportButtons.github) {
            this.exportButtons.github.addEventListener('click', () => this.handleExport('github'));
        }
        if (this.exportButtons.netlify) {
            this.exportButtons.netlify.addEventListener('click', () => this.handleExport('netlify'));
        }
        if (this.exportButtons.vercel) {
            this.exportButtons.vercel.addEventListener('click', () => this.handleExport('vercel'));
        }
    }

    // Direct file download — the server builds the package and streams it
    // back. No fake "deploy" promises: platform buttons download a
    // ready-to-publish folder (with netlify.toml / vercel.json / .nojekyll)
    // that the user drops onto the platform themselves.
    handleExport(type) {
        if (this.isExporting) return;
        this.isExporting = true;
        const button = this.getButtonForType(type);
        this.setButtonLoading(button, true);

        const urls = {
            zip: '/export-zip',
            github: '/export-platform/github-pages',
            netlify: '/export-platform/netlify',
            vercel: '/export-platform/vercel',
        };
        const names = {
            zip: 'ZIP',
            github: 'GitHub Pages package',
            netlify: 'Netlify package',
            vercel: 'Vercel package',
        };

        try {
            const link = document.createElement('a');
            link.href = urls[type] || urls.zip;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.uiManager.showToast(`${names[type] || 'ZIP'} downloading — check your downloads folder.`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.uiManager.showToast('Export failed: could not start the download.', 'error');
        } finally {
            // Let the download begin before restoring the button.
            setTimeout(() => {
                this.setButtonLoading(button, false);
                this.isExporting = false;
            }, 800);
        }
    }

    getButtonForType(type) {
        switch (type) {
            case 'zip':
                return this.exportButtons.export;
            case 'github':
                return this.exportButtons.github;
            case 'netlify':
                return this.exportButtons.netlify;
            case 'vercel':
                return this.exportButtons.vercel;
            default:
                throw new Error('Unknown export type');
        }
    }

    setButtonLoading(button, isLoading) {
        if (!button) return;
        const span = button.querySelector('span');
        const icon = button.querySelector('img');

        if (isLoading) {
            button.disabled = true;
            if (span) span.textContent = 'Exporting...';
            if (icon) icon.style.opacity = '0.5';
        } else {
            button.disabled = false;
            const type = this.getButtonType(button);
            if (span) span.textContent = this.getButtonText(type);
            if (icon) icon.style.opacity = '1';
        }
    }

    getButtonType(button) {
        if (button === this.exportButtons.export) return 'zip';
        if (button === this.exportButtons.github) return 'github';
        if (button === this.exportButtons.netlify) return 'netlify';
        if (button === this.exportButtons.vercel) return 'vercel';
        return 'zip';
    }

    getButtonText(type) {
        switch (type) {
            case 'zip':
                return 'Export';
            case 'github':
                return 'GitHub Pages';
            case 'netlify':
                return 'Netlify';
            case 'vercel':
                return 'Vercel';
            default:
                return 'Export';
        }
    }
}
