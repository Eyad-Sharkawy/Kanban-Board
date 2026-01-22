export class StorageService {

    save(key: string, data: any): void {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
        } catch (error) {
            console.error("Error saving to localStorage", error);
        }
    }

    load<T>(key: string): T | null {
    try {
        const serializedData = localStorage.getItem(key);

        if (serializedData === null) {
            return null;
        }

        return JSON.parse(serializedData) as T;
    } catch(error) {
        console.error("Error Loading from LocalStorage", error);
        return null;
    }
    }

    remove(key: string) {
        localStorage.removeItem(key);
    }

    clear() {
        localStorage.clear();
    }
}