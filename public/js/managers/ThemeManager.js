const THEME_KEY = "prompt2page-theme";

export class ThemeManager {
    constructor({ storage, themeButton, themeStylesheet }) {
        this.storage = storage;
        this.themeButton = themeButton;
        this.themeStylesheet = themeStylesheet;
    }

    initialize() {
        this.applyTheme(
            this.storage.get(THEME_KEY, "light")
        );

        this.themeButton?.addEventListener("click", () => {
            this.toggleTheme();
        });
    }

    applyTheme(theme) {
        if (this.themeStylesheet) {
            this.themeStylesheet.href = `css/base/themes/${theme}.css?v=20261023`;
        }

        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.classList.remove("theme-light", "theme-dark");
        document.documentElement.classList.add(`theme-${theme}`);

        this.storage.set(THEME_KEY, theme);
        this.updateThemeButton(theme);
    }

    toggleTheme() {
        const currentTheme = this.storage.get(THEME_KEY, "light");
        const nextTheme = currentTheme === "light" ? "dark" : "light";

        this.applyTheme(nextTheme);
    }

    updateThemeButton(theme) {
        if (!this.themeButton) return;

        this.themeButton.innerHTML =
            theme === "light"
                ? '<img src="/assets/icons/sun.svg" class="nav-icon theme-icon" alt="Sun">'
                : '<img src="/assets/icons/moon.svg" class="nav-icon theme-icon" alt="Moon">';
    }
}
