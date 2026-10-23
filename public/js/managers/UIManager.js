import { escapeHtml, setVisible } from "../utils/dom.js";
import { formatReply } from "../utils/format.js";

export class UIManager {
    constructor(elements) {
        this.elements = elements;
        this.defaultChatMarkup = this.elements.chatArea.innerHTML.trim();
        this.pageInfoPanel = document.querySelector(".page-info");
    }

    addUserMessage(message) {
        const messageElement = document.createElement("div");

        messageElement.className = "user-message";
        messageElement.innerHTML = `
            <strong>You</strong>
            <p>${escapeHtml(message)}</p>
        `;

        this.elements.chatArea.appendChild(messageElement);
        this.scrollChatToBottom();
    }

    addAssistantMessage(message) {
        const messageElement = document.createElement("div");

        messageElement.className = "bot-message";
        messageElement.innerHTML = `
            <strong>Prompt2Page AI</strong>
            <p>${formatReply(message)}</p>
        `;

        this.elements.chatArea.appendChild(messageElement);
        this.scrollChatToBottom();
    }

    showThinkingState() {
        const thinking = document.createElement("div");

        thinking.className = "bot-message is-thinking";
        thinking.id = "thinkingMessage";
        thinking.innerHTML = `
            <strong>Prompt2Page AI</strong>
            <div class="message-skeleton">
                ${this.getSkeletonMarkup()}
            </div>
        `;

        this.elements.chatArea.appendChild(thinking);
        this.scrollChatToBottom();
    }

    hideThinkingState() {
        document.getElementById("thinkingMessage")?.remove();
    }

    clearCommandInput() {
        this.elements.commandInput.value = "";
    }

    clearChat() {
        if (this.elements.chatArea.children.length <= 1) return false;

        this.elements.chatArea.innerHTML = this.defaultChatMarkup;
        return true;
    }

    setInputLoading(isLoading) {
        this.elements.commandInput.disabled = isLoading;
        this.elements.sendButton.disabled = isLoading;
        this.elements.sendButton.classList.toggle("is-loading", isLoading);

        if (!isLoading) {
            this.elements.commandInput.focus();
        }
    }

    updatePageInfo(pageInfo, animate = true) {
        if (!pageInfo) return;

        this.elements.pageNameValue.textContent = pageInfo.name || "-";
        this.elements.createdValue.textContent = pageInfo.created || "-";
        this.elements.modifiedValue.textContent = pageInfo.modified || "-";
        this.elements.statusValue.textContent = pageInfo.status || "No Active Page";
        if (animate) this.animatePageInfo();
    }

    clearPageInfo() {
        this.elements.pageNameValue.textContent = "-";
        this.elements.createdValue.textContent = "-";
        this.elements.modifiedValue.textContent = "-";
        this.elements.statusValue.textContent = "No Active Page";
    }

    showRecentPagesLoading() {
        setVisible(this.elements.recentPagesPlaceholder, false);
        this.elements.recentPages.innerHTML = "";

        for (let index = 0; index < 4; index++) {
            const card = document.createElement("div");

            card.className = "page-card page-card-skeleton";
            card.innerHTML = this.getSkeletonMarkup();

            this.elements.recentPages.appendChild(card);
        }
    }

    renderRecentPages(pages, activePage, onSelectPage, staggerDelay = 45) {
        this.elements.recentPages.innerHTML = "";

        if (!pages || pages.length === 0) {
            setVisible(this.elements.recentPagesPlaceholder, true);
            return;
        }

        setVisible(this.elements.recentPagesPlaceholder, false);

        pages.forEach((page, index) => {
            const card = document.createElement("div");
            const isActive = page === activePage;

            card.className = isActive
                ? "page-card active-page is-entering"
                : "page-card is-entering";
            card.style.setProperty("--card-delay", `${index * staggerDelay}ms`);

            card.innerHTML = `
                <div class="page-top">
                    <div class="page-icon">
                        <img src="/assets/icons/empty-pages.svg" class="panel-icon theme-icon" alt="">
                    </div>
                    <h3>${escapeHtml(page)}</h3>
                </div>
                <p>${isActive ? "Currently Editing" : "Website Page"}</p>
                <span class="${isActive ? "active-badge" : ""}">${isActive ? "Active" : ""}</span>
            `;

            card.addEventListener("click", () => {
                if (!isActive) onSelectPage(page);
            });

            this.elements.recentPages.appendChild(card);
        });
    }

    animatePageInfo() {
        if (!this.pageInfoPanel) return;

        this.pageInfoPanel.classList.remove("is-updating");
        requestAnimationFrame(() => {
            this.pageInfoPanel.classList.add("is-updating");
        });
    }

    pulseActiveBadge() {
        const badge = this.elements.recentPages.querySelector(".active-badge");

        if (!badge) return;

        badge.classList.remove("is-active-badge");
        requestAnimationFrame(() => badge.classList.add("is-active-badge"));
    }

    showBuildProgress(steps) {
        const progress = document.createElement("div");

        progress.className = "build-progress";
        progress.innerHTML = steps.map((step) => `
            <div class="build-progress-step">
                <span class="build-progress-mark">○</span>
                <span>${escapeHtml(step)}</span>
            </div>
        `).join("");
        this.elements.chatArea.appendChild(progress);
        this.scrollChatToBottom();

        return progress;
    }

    completeBuildProgressStep(progress, index) {
        const step = progress.children[index];

        if (!step) return;

        step.classList.add("is-complete");
        step.querySelector(".build-progress-mark").textContent = "✓";
        this.scrollChatToBottom();
    }

    scrollChatToBottom() {
        this.elements.chatArea.scrollTo({
            top: this.elements.chatArea.scrollHeight,
            behavior: "smooth"
        });
    }

    getSkeletonMarkup() {
        return `
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line skeleton-short"></div>
        `;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}
