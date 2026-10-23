import { getElement, getElements } from "./utils/dom.js";
import { ApiService } from "./services/ApiService.js";
import { StorageManager } from "./managers/StorageManager.js";
import { ThemeManager } from "./managers/ThemeManager.js";
import { PreviewManager } from "./managers/PreviewManager.js";
import { UIManager } from "./managers/UIManager.js";
import { PageManager } from "./managers/PageManager.js";
import { CommandManager } from "./managers/CommandManager.js";
import { UploadManager } from "./managers/UploadManager.js";
import { DragDropManager } from "./managers/DragDropManager.js";
import { MediaLibraryManager } from "./managers/MediaLibraryManager.js";
import { ExportManager } from "./managers/ExportManager.js";
import { ViewManager } from "./managers/ViewManager.js";
import { PagesManager } from "./managers/PagesManager.js";
import { TemplatesManager } from "./managers/TemplatesManager.js";
import { CommandsManager } from "./managers/CommandsManager.js";
import { StyleManagerView } from "./managers/StyleManagerView.js";
import { ComponentsManager } from "./managers/ComponentsManager.js";
import { SitesManager } from "./managers/SitesManager.js";
import { AnimationOrchestrator } from "./animation/AnimationOrchestrator.js";

document.addEventListener("DOMContentLoaded", () => {

    const elements = {
        chatArea: getElement("#chatArea"),
        commandInput: getElement("#commandInput"),
        sendButton: getElement("#sendButton"),
        clearButton: getElement(".clear-btn"),
        uploadButton: getElement("#uploadButton"),
        fileInput: getElement("#fileInput"),
        commandPanel: getElement(".command-panel"),
        themeButton: getElement("#themeButton"),
        themeStylesheet: getElement("#themeStylesheet"),
        recentPages: getElement("#recentPages"),
        recentPagesPlaceholder: getElement("#recentPagesPlaceholder"),
        pageNameValue: getElement("#pageNameValue"),
        createdValue: getElement("#createdValue"),
        modifiedValue: getElement("#modifiedValue"),
        statusValue: getElement("#statusValue"),
        openPageButton: getElement("#openPageButton"),
        browserUrl: getElement("#browserUrl"),
        previewPlaceholder: getElement("#previewPlaceholder"),
        previewLoading: getElement("#previewLoading"),
        previewFrame: getElement("#previewFrame"),
        previewPanel: getElement(".preview-panel"),
        deviceButtons: getElements(".device-btn"),
        dashboardNavButton: getElement("#dashboardNavButton"),
        sidebarNavButtons: getElements(".nav-btn"),
        dashboardView: getElement("#dashboardView"),
        mediaLibraryView: getElement("#mediaLibraryView"),
        moreView: getElement("#moreView"),
        previewDot: getElement("#previewDot"),
        sitesView: getElement("#sitesView"),
        siteGrid: getElement("#siteGrid"),
        sitesEmpty: getElement("#sitesEmpty"),
        pagesView: getElement("#pagesView"),
        templatesView: getElement("#templatesView"),
        commandsView: getElement("#commandsView"),
        styleView: getElement("#styleView"),
        componentsView: getElement("#componentsView"),
        pageGrid: getElement("#pageGrid"),
        pagesEmpty: getElement("#pagesEmpty"),
        addPageButton: getElement("#addPageButton"),
        templateGrid: getElement("#templateGrid"),
        commandGroups: getElement("#commandGroups"),
        themeGrid: getElement("#themeGrid"),
        componentGrid: getElement("#componentGrid"),
        previewNavButton: getElement("#previewNavButton"),
        settingsNavButton: getElement("#settingsNavButton"),
        aboutNavButton: getElement("#aboutNavButton"),
        helpButton: getElement("#helpButton"),
        settingsTopButton: getElement("#settingsTopButton"),
        settingsModal: getElement("#settingsModal"),
        aboutModal: getElement("#aboutModal"),
        helpModal: getElement("#helpModal"),
        settingsThemeToggle: getElement("#settingsThemeToggle"),
        settingsWipeButton: getElement("#settingsWipeButton"),
        viewAllPagesButton: getElement("#viewAllPagesButton"),
        mediaLibraryGrid: getElement("#mediaLibraryGrid"),
        mediaLibraryPlaceholder: getElement("#mediaLibraryPlaceholder"),
        mediaLibraryNoResults: getElement("#mediaLibraryNoResults"),
        mediaLibrarySearchInput: getElement("#mediaLibrarySearchInput"),
        mediaLibraryUploadButton: getElement("#mediaLibraryUploadButton"),
        mediaLibraryEmptyUploadButton: getElement("#mediaLibraryEmptyUploadButton"),
        replaceFileInput: getElement("#replaceFileInput"),
        exportButton: getElement("#exportButton"),
        githubExportButton: getElement("#githubExportButton"),
        netlifyExportButton: getElement("#netlifyExportButton"),
        vercelExportButton: getElement("#vercelExportButton")
    };

    const apiService = new ApiService();
    const storageManager = new StorageManager();
    const uiManager = new UIManager(elements);

    const themeManager = new ThemeManager({
        storage: storageManager,
        themeButton: elements.themeButton,
        themeStylesheet: elements.themeStylesheet
    });

    const previewManager = new PreviewManager({
        previewPanel: elements.previewPanel,
        previewPlaceholder: elements.previewPlaceholder,
        previewLoading: elements.previewLoading,
        previewFrame: elements.previewFrame,
        deviceButtons: elements.deviceButtons,
        browserUrl: elements.browserUrl
    });

    const exportManager = new ExportManager({
        uiManager
    });

    exportManager.initialize(
        elements.exportButton,
        elements.githubExportButton,
        elements.netlifyExportButton,
        elements.vercelExportButton
    );

    const pageManager = new PageManager({
        apiService,
        uiManager,
        previewManager,
        openPageButton: elements.openPageButton,
        exportManager
    });

    const animationOrchestrator = new AnimationOrchestrator({
        uiManager,
        pageManager,
        previewManager
    });

    const mediaLibraryManager = new MediaLibraryManager({
        apiService,
        uiManager,
        dashboardView: elements.dashboardView,
        mediaLibraryView: elements.mediaLibraryView,
        grid: elements.mediaLibraryGrid,
        placeholder: elements.mediaLibraryPlaceholder,
        noResults: elements.mediaLibraryNoResults,
        searchInput: elements.mediaLibrarySearchInput,
        replaceFileInput: elements.replaceFileInput
    });

    // ---- View navigation (sidebar) ----
    // Lazy: commandManager is created just below; these closures run later.

    let commandManagerRef = null;
    const sendChatCommand = (message) => commandManagerRef.queueCommand(message);
    const sendSilentCommand = (message) => commandManagerRef.runSilent(message);

    let pagesManagerRef = null;
    let sitesManagerRef = null;

    const viewManager = new ViewManager({
        navButtons: elements.sidebarNavButtons,
        views: {
            dashboardView: elements.dashboardView,
            sitesView: elements.sitesView,
            pagesView: elements.pagesView,
            commandsView: elements.commandsView,
            templatesView: elements.templatesView,
            styleView: elements.styleView,
            componentsView: elements.componentsView,
            mediaLibraryView: elements.mediaLibraryView,
            moreView: elements.moreView,
        },
        onShow: {
            sitesView: () => sitesManagerRef?.load(),
            pagesView: () => pagesManagerRef?.load(),
            mediaLibraryView: () => mediaLibraryManager.load(),
        },
    });

    // MediaLibraryManager delegates its view switching to the ViewManager.
    mediaLibraryManager.viewManager = viewManager;

    const pagesManager = new PagesManager({
        grid: elements.pageGrid,
        emptyState: elements.pagesEmpty,
        addButton: elements.addPageButton,
        sendCommand: sendSilentCommand,
        uiManager,
    });
    pagesManagerRef = pagesManager;

    const templatesManager = new TemplatesManager({
        grid: elements.templateGrid,
        sendCommand: sendChatCommand,
        viewManager,
    });

    const commandsManager = new CommandsManager({
        container: elements.commandGroups,
        sendCommand: sendChatCommand,
        viewManager,
    });

    const styleManagerView = new StyleManagerView({
        grid: elements.themeGrid,
        sendCommand: sendChatCommand,
        viewManager,
    });

    const componentsManager = new ComponentsManager({
        grid: elements.componentGrid,
        sendCommand: sendChatCommand,
        viewManager,
    });

    const sitesManager = new SitesManager({
        grid: elements.siteGrid,
        emptyState: elements.sitesEmpty,
        sendCommand: sendSilentCommand,
        viewManager,
        uiManager,
    });
    sitesManagerRef = sitesManager;

    viewManager.initialize();
    pagesManager.initialize();
    sitesManager.initialize();
    templatesManager.initialize();
    commandsManager.initialize();
    styleManagerView.initialize();
    componentsManager.initialize();
    viewManager.show("dashboardView");

    // ---- Preview nav: scroll the (always visible) preview into focus ----

    elements.previewNavButton?.addEventListener("click", () => {
        viewManager.show("dashboardView");
        elements.previewPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        elements.previewPanel?.classList.add("preview-pulse");
        setTimeout(() => elements.previewPanel?.classList.remove("preview-pulse"), 1200);
    });

    // ---- Modals: Settings / About / Help ----

    const openModal = (modal) => { if (modal) modal.hidden = false; };
    const closeModals = () => {
        [elements.settingsModal, elements.aboutModal, elements.helpModal].forEach((m) => {
            if (m) m.hidden = true;
        });
    };

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
        btn.addEventListener("click", closeModals);
    });
    [elements.settingsModal, elements.aboutModal, elements.helpModal].forEach((modal) => {
        modal?.addEventListener("click", (e) => {
            if (e.target === modal) closeModals();
        });
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModals();
    });

    elements.settingsNavButton?.addEventListener("click", () => openModal(elements.settingsModal));
    elements.settingsTopButton?.addEventListener("click", () => openModal(elements.settingsModal));
    elements.aboutNavButton?.addEventListener("click", () => openModal(elements.aboutModal));
    elements.helpButton?.addEventListener("click", () => openModal(elements.helpModal));

    elements.settingsThemeToggle?.addEventListener("click", () => themeManager.toggleTheme());

    elements.settingsWipeButton?.addEventListener("click", async () => {
        if (!window.confirm("Delete every site on this device? This can't be undone.")) return;
        closeModals();
        viewManager.show("dashboardView");
        await sendChatCommand("delete everything");
    });

    elements.viewAllPagesButton?.addEventListener("click", () => {
        viewManager.show("pagesView");
    });

    // ---- Mobile tab bar (phone shell): Build / Preview / Sites / More ----
    // The dashboard does double duty: body[data-mtab] decides whether the
    // command panel (build) or the preview panel (preview) fills the screen.

    const mobileTabForView = {
        sitesView: "sites",
        pagesView: "more",
        templatesView: "more",
        commandsView: "more",
        styleView: "more",
        componentsView: "more",
        mediaLibraryView: "more",
        moreView: "more",
    };
    let mobileTab = "build";

    const setMobileTab = (tab) => {
        mobileTab = tab;
        document.body.dataset.mtab = tab;
        document.querySelectorAll(".mtab").forEach((b) => {
            b.classList.toggle("is-active", b.dataset.mtab === tab);
        });
    };

    const baseShow = viewManager.show.bind(viewManager);
    viewManager.show = (viewId) => {
        baseShow(viewId);
        if (viewId === "dashboardView") {
            if (mobileTab !== "build" && mobileTab !== "preview") setMobileTab("build");
        } else if (mobileTabForView[viewId]) {
            setMobileTab(mobileTabForView[viewId]);
        }
    };

    const showMobileTab = (tab) => {
        if (tab === "build" || tab === "preview") {
            setMobileTab(tab);
            baseShow("dashboardView");
            if (tab === "preview" && elements.previewDot) elements.previewDot.hidden = true;
        } else if (tab === "sites") {
            viewManager.show("sitesView");
        } else if (tab === "more") {
            viewManager.show("moreView");
        }
    };

    document.querySelectorAll(".mtab").forEach((btn) => {
        btn.addEventListener("click", () => showMobileTab(btn.dataset.mtab));
    });
    document.querySelectorAll("[data-goto]").forEach((btn) => {
        btn.addEventListener("click", () => viewManager.show(btn.dataset.goto));
    });
    document.querySelectorAll("[data-open-modal]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const modal = document.getElementById(btn.dataset.openModal);
            if (modal) modal.hidden = false;
        });
    });
    setMobileTab("build");

    // After a build/update, flag the Preview tab and offer a one-tap jump
    // from the chat (the chip only exists on phone widths, via CSS).
    window.addEventListener("p2p:previewUpdated", () => {
        if (mobileTab !== "preview" && elements.previewDot) {
            elements.previewDot.hidden = false;
        }
        if (elements.chatArea && !elements.chatArea.querySelector(".preview-chip")) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "preview-chip";
            chip.textContent = "View preview →";
            chip.addEventListener("click", () => {
                chip.remove();
                showMobileTab("preview");
            });
            elements.chatArea.appendChild(chip);
            elements.chatArea.scrollTop = elements.chatArea.scrollHeight;
        }
    });

    const commandManager = new CommandManager({
        apiService,
        uiManager,
        pageManager,
        previewManager,
        animationOrchestrator,
        mediaLibraryManager,
        commandInput: elements.commandInput,
        sendButton: elements.sendButton,
        clearButton: elements.clearButton
    });
    commandManagerRef = commandManager;

    elements.mediaLibraryUploadButton?.addEventListener("click", () => {
        elements.fileInput.click();
    });

    elements.mediaLibraryEmptyUploadButton?.addEventListener("click", () => {
        elements.fileInput.click();
    });

    const uploadManager = new UploadManager({
        uploadButton: elements.uploadButton,
        fileInput: elements.fileInput,
        apiService,
        uiManager,
        onUploaded: () => mediaLibraryManager.refresh()
    });

    const dragDropManager = new DragDropManager({
        dropZones: [elements.commandPanel, elements.mediaLibraryView],
        uploadManager
    });

    themeManager.initialize();
    previewManager.initialize();
    commandManager.initialize();
    uploadManager.initialize();
    mediaLibraryManager.initialize();
    dragDropManager.initialize();

    pageManager.initialize((page) => {
        commandManager.queueCommand(`switch page ${page}`);
    });

    pageManager.loadState();

    // First-run onboarding: if there are no sites yet, greet the user
    // with guidance instead of an empty chat.
    (async () => {
        try {
            const state = await apiService.getApplicationState();
            const projects = state?.projects || [];
            if (projects.length === 0 && !sessionStorage.getItem("p2p-welcomed")) {
                sessionStorage.setItem("p2p-welcomed", "1");
                uiManager.addAssistantMessage(
                    "Welcome to Prompt2Page! Tell me what kind of website you want — " +
                    "for example, \"i need a bakery website\". Or open Templates in the " +
                    "sidebar for one-click starters."
                );
            }
        } catch {}
    })();

    const updateExportButtonState = async () => {
        try {
            const state = await apiService.getApplicationState();
            if (state.project) {
                elements.exportButton?.removeAttribute('disabled');
                elements.githubExportButton?.removeAttribute('disabled');
                elements.netlifyExportButton?.removeAttribute('disabled');
                elements.vercelExportButton?.removeAttribute('disabled');
            } else {
                elements.exportButton?.setAttribute('disabled', 'true');
                elements.githubExportButton?.setAttribute('disabled', 'true');
                elements.netlifyExportButton?.setAttribute('disabled', 'true');
                elements.vercelExportButton?.setAttribute('disabled', 'true');
            }
        } catch (error) {
            console.error('Failed to check project state:', error);
        }
    };

    updateExportButtonState();

});
