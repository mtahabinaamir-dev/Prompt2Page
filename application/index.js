// Use Cases
const ProjectUseCase = require("./usecases/ProjectUseCase");
const PageUseCase = require("./usecases/PageUseCase");
const ComponentUseCase = require("./usecases/ComponentUseCase");
const AssetUseCase = require("./usecases/AssetUseCase");
const ExportUseCase = require("./usecases/ExportUseCase");

// AI Pipeline
const AIOrchestrator = require("./ai/AIOrchestrator");
const WebsiteGenerator = require("./ai/WebsiteGenerator");
const BlueprintLibrary = require("./ai/BlueprintLibrary");
const BlueprintSelector = require("./ai/BlueprintSelector");

// Natural-language routing (replaces the old rigid command parser)
const IntentRouter = require("./routing/IntentRouter");
const TargetResolver = require("./routing/TargetResolver");

// Rendering Engine
const HTMLRenderer = require("./rendering/HTMLRenderer");
const CSSRenderer = require("./rendering/CSSRenderer");
const PreviewRenderer = require("./rendering/PreviewRenderer");
const Renderer = require("./rendering/Renderer");

// State Managers
const ProjectState = require("./state/ProjectState");
const PageState = require("./state/PageState");
const ConversationState = require("./state/ConversationState");
const HistoryState = require("./state/HistoryState");

module.exports = {
    // Use Cases
    ProjectUseCase,
    PageUseCase,
    ComponentUseCase,
    AssetUseCase,
    ExportUseCase,

    // AI
    AIOrchestrator,
    WebsiteGenerator,
    BlueprintLibrary,
    BlueprintSelector,

    // Routing
    IntentRouter,
    TargetResolver,

    // Rendering
    HTMLRenderer,
    CSSRenderer,
    PreviewRenderer,
    Renderer,

    // State
    ProjectState,
    PageState,
    ConversationState,
    HistoryState
};
