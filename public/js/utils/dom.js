export function getElement(selector, root = document) {
    return root.querySelector(selector);
}

export function getElements(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

export function setVisible(element, isVisible, display = "flex") {
    if (!element) return;

    element.style.display = isVisible ? display : "none";
}

export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
