export class StorageManager {
    get(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : fallback;
        }
        catch (error) {
            return fallback;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, value);
        }
        catch (error) {
        }
    }
}
