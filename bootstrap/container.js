const {
    FileSystemProjectRepository,
    FileSystemPageRepository,
    FileSystemComponentRepository,
    FileSystemAssetRepository,
    FileSystemExportRepository
} = require("../infrastructure/filesystem");

const {
    ProjectService,
    PageService,
    ComponentService,
    AssetService,
    ExportService
} = require("../domain");

const {
    ProjectUseCase,
    PageUseCase,
    ComponentUseCase,
    AssetUseCase,
    ExportUseCase,
    AIOrchestrator,
    WebsiteGenerator,
    BlueprintLibrary,
    BlueprintSelector,
    IntentRouter,
    TargetResolver,
    HTMLRenderer,
    CSSRenderer,
    PreviewRenderer,
    Renderer,
    ProjectState,
    PageState,
    ConversationState,
    HistoryState
} = require("../application");

class Container {

    constructor() {

        this._instances = new Map();

        this.registerDependencies();

    }

    registerDependencies() {

        // State Managers
        this._instances.set("ProjectState", ProjectState);
        this._instances.set("PageState", PageState);
        this._instances.set("ConversationState", ConversationState);
        this._instances.set("HistoryState", HistoryState);

        // Rendering Engine
        this._instances.set("HTMLRenderer", new HTMLRenderer());
        this._instances.set("CSSRenderer", new CSSRenderer());
        this._instances.set("PreviewRenderer", new PreviewRenderer(this.get("HTMLRenderer"), this.get("CSSRenderer")));
        this._instances.set("Renderer", new Renderer(this.get("HTMLRenderer"), this.get("CSSRenderer"), this.get("PreviewRenderer")));

        // Repositories
        this._instances.set("ProjectRepository", new FileSystemProjectRepository());
        this._instances.set("PageRepository", new FileSystemPageRepository());
        this._instances.set("ComponentRepository", new FileSystemComponentRepository());
        this._instances.set("AssetRepository", new FileSystemAssetRepository());
        this._instances.set("ExportRepository", new FileSystemExportRepository());

        // Natural-language routing (replaces the old rigid command parser)
        this._instances.set("IntentRouter", new IntentRouter(this));
        this._instances.set("TargetResolver", new TargetResolver());

        // AI Pipeline
        this._instances.set("WebsiteGenerator", new WebsiteGenerator());
        this._instances.set("BlueprintLibrary", new BlueprintLibrary());
        this._instances.set("BlueprintSelector", new BlueprintSelector(this.get("BlueprintLibrary")));

        this._instances.set(
            "AIOrchestrator",
            new AIOrchestrator({
                websiteGenerator: this.get("WebsiteGenerator"),
                htmlRenderer: this.get("HTMLRenderer")
            })
        );

        // Services
        this._instances.set("ProjectService", new ProjectService(this.get("ProjectRepository")));
        this._instances.set("PageService", new PageService(this.get("PageRepository")));
        this._instances.set(
            "ComponentService",
            new ComponentService(
                this.get("ComponentRepository"),
                this.get("PageRepository")
            )
        );
        this._instances.set("AssetService", new AssetService(this.get("AssetRepository")));
        this._instances.set(
            "ExportService",
            new ExportService(
                this.get("ExportRepository"),
                this.get("PageRepository"),
                this.get("AssetRepository"),
                this.get("ProjectRepository")
            )
        );

        // Use Cases
        this._instances.set(
            "ProjectUseCase",
            new ProjectUseCase(
                this.get("ProjectService"),
                this.get("PageService")
            )
        );
        this._instances.set("PageUseCase", new PageUseCase(this.get("PageService")));
        this._instances.set("ComponentUseCase", new ComponentUseCase(this.get("ComponentService")));
        this._instances.set("AssetUseCase", new AssetUseCase(this.get("AssetService")));
        this._instances.set("ExportUseCase", new ExportUseCase(this.get("ExportService")));

    }

    get(name) {

        if (!this._instances.has(name)) {

            throw new Error(`Dependency '${name}' not found`);

        }

        return this._instances.get(name);

    }

}

module.exports = new Container();
