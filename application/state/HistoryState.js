class HistoryState {

    constructor() {

        this.history = [];

    }

    push(command, result) {

        const entry = {
            id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            command,
            result,
            timestamp: new Date()
        };

        this.history.push(entry);

        // Bound memory: keep recent history, drop the oldest.
        if (this.history.length > 100) {

            this.history.splice(0, this.history.length - 100);

        }

        return entry;

    }

    getHistory() {

        return [...this.history];

    }

    get() {

        return this.getHistory();

    }

    clear() {

        this.history = [];

    }

}

module.exports = new HistoryState();
