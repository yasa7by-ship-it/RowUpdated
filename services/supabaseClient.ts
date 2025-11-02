import { createClient } from '@supabase/supabase-js';

// --- Hybrid Storage for Session Persistence ---
const getStorage = (): Storage => {
    try {
        const persist = window.localStorage.getItem('session-persistence') === 'true';
        return persist ? window.localStorage : window.sessionStorage;
    } catch (e) {
        // Fallback for non-browser env
        const memoryStorage = new Map<string, string>();
        return {
            getItem: (key: string): string | null => memoryStorage.get(key) ?? null,
            // FIX: Wrapped arrow function body in curly braces to prevent implicitly returning the Map instance, which conflicts with the 'void' return type.
            setItem: (key: string, value: string): void => { memoryStorage.set(key, value); },
            // FIX: Wrapped arrow function body in curly braces to prevent implicitly returning a boolean, which conflicts with the 'void' return type.
            removeItem: (key: string): void => { memoryStorage.delete(key); },
            get length(): number { return memoryStorage.size; },
            clear: (): void => memoryStorage.clear(),
            key: (index: number): string | null => Array.from(memoryStorage.keys())[index] ?? null,
        };
    }
};

const hybridStorage = {
    getItem: (key: string) => {
        return getStorage().getItem(key);
    },
    setItem: (key: string, value: string) => {
        getStorage().setItem(key, value);
    },
    removeItem: (key: string) => {
        getStorage().removeItem(key);
    },
};

export const setSessionPersistence = (persist: boolean) => {
    try {
        window.localStorage.setItem('session-persistence', String(persist));
    } catch (e) {
        console.error("Could not set session persistence:", e);
    }
};
// --- End of Hybrid Storage ---

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: hybridStorage,
    }
});