class ConversationState {

    constructor() {

        this.messages = [];
        this.currentProject = null;
        this.currentPage = null;
        this.lastComponent = null;
        this.activeSelection = null;

    }

    addMessage(role, content) {

        const msg = {
            id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            role,
            content,
            timestamp: new Date()
        };

        this.messages.push(msg);

        // Bound memory: keep the recent conversation, drop the oldest.
        if (this.messages.length > 100) {

            this.messages.splice(0, this.messages.length - 100);

        }

        return msg;

    }

    getMessages() {

        return [...this.messages];

    }

    setCurrentProject(project) {

        this.currentProject = project;

    }

    setCurrentPage(page) {

        this.currentPage = page;

    }

    setLastComponent(component) {

        this.lastComponent = component;

    }

    setActiveSelection(selection) {

        this.activeSelection = selection;

    }

    setContext({ currentProject, currentPage, lastComponent, activeSelection } = {}) {

        if (currentProject !== undefined) this.currentProject = currentProject;
        if (currentPage !== undefined) this.currentPage = currentPage;
        if (lastComponent !== undefined) this.lastComponent = lastComponent;
        if (activeSelection !== undefined) this.activeSelection = activeSelection;

    }

    getContext() {

        return {
            currentProject: this.currentProject,
            currentPage: this.currentPage,
            lastComponent: this.lastComponent,
            activeSelection: this.activeSelection,
            messages: [...this.messages]
        };

    }

    get() {

        return this.getContext();

    }

    clear() {

        this.messages = [];
        this.currentProject = null;
        this.currentPage = null;
        this.lastComponent = null;
        this.activeSelection = null;

    }

}

module.exports = new ConversationState();
