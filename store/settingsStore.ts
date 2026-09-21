import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsAction {
    type: 'UPDATE_SETTINGS';
    updates: Record<string, any>;
}

interface SettingsState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    lastModified: number;
    wallpaper: string;
    theme: 'light' | 'dark' | 'auto';
    hideConfig: Record<string, boolean>;

    // Local Media
    customDesktopWallpapers: string[];

    // Actions
    setWallpaper: (url: string) => void;
    setTheme: (theme: 'light' | 'dark' | 'auto') => void;
    toggleWidget: (key: string, value: boolean) => void;
    fetchSettings: () => Promise<void>;
}

// ----------------------------------------------------------------------
// QUEUE & SYNC ENGINE
// ----------------------------------------------------------------------
export const syncSettingsQueue = async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const token = localStorage.getItem('dashboard_sync_token');
    if (!token) return;

    const queueStr = localStorage.getItem('settings_offline_queue');
    if (!queueStr) return;

    let actions: SettingsAction[] = [];
    try { actions = JSON.parse(queueStr); } catch (e) { return; }
    if (actions.length === 0) return;

    try {
        const res = await fetch('/api/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ actions })
        });
        
        if (res.ok) {
            localStorage.removeItem('settings_offline_queue');
        }
    } catch (e) {
        console.warn("[Settings] Failed to push offline queue. Will retry later.", e);
    }
};

const queueSettingsAction = (action: SettingsAction) => {
    if (typeof window === 'undefined') return;
    
    let queue: SettingsAction[] = [];
    try {
        const queueStr = localStorage.getItem('settings_offline_queue');
        if (queueStr) queue = JSON.parse(queueStr);
    } catch (e) {}

    queue.push(action);
    localStorage.setItem('settings_offline_queue', JSON.stringify(queue));

    if (navigator.onLine) {
        syncSettingsQueue();
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('online', syncSettingsQueue);
    window.addEventListener('app_sync_now', syncSettingsQueue);
}

// ----------------------------------------------------------------------
// STORE
// ----------------------------------------------------------------------
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            lastModified: 0,
            wallpaper: '/wallpapers/naruto.webp',
            theme: 'dark',
            hideConfig: {},
            customDesktopWallpapers: [],

            setWallpaper: (url) => set((state) => {
                queueSettingsAction({ type: 'UPDATE_SETTINGS', updates: { 'generalSettings.wallpaper': url } });
                return { wallpaper: url, lastModified: Date.now() };
            }),

            setTheme: (theme) => set((state) => {
                queueSettingsAction({ type: 'UPDATE_SETTINGS', updates: { 'generalSettings.theme': theme } });
                return { theme, lastModified: Date.now() };
            }),

            toggleWidget: (key, value) => set((state) => {
                const newHideConfig = { ...state.hideConfig, [key]: value };
                queueSettingsAction({ type: 'UPDATE_SETTINGS', updates: { [`hideConfig.${key}`]: value } });
                return { hideConfig: newHideConfig, lastModified: Date.now() };
            }),

            fetchSettings: async () => {
                const queueStr = localStorage.getItem('settings_offline_queue');
                if (queueStr && JSON.parse(queueStr).length > 0) {
                    await syncSettingsQueue();
                    if (localStorage.getItem('settings_offline_queue')) return; // Queue didn't clear, skip fetch
                }

                if (typeof window !== 'undefined' && !navigator.onLine) return;
                const token = localStorage.getItem('dashboard_sync_token');
                if (!token) return;

                try {
                    const res = await fetch(`/api/settings?t=${Date.now()}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        cache: 'no-store'
                    });

                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && json.data) {
                            const cloudModified = json.data.lastModified || 0;
                            const localModified = get().lastModified || 0;

                            // Protect local un-synced data, only accept cloud if strictly newer
                            if (cloudModified >= localModified) {
                                set({
                                    wallpaper: json.data.wallpaper || get().wallpaper,
                                    theme: json.data.theme || get().theme,
                                    hideConfig: json.data.hideConfig || get().hideConfig,
                                    lastModified: cloudModified
                                });
                            } else {
                                // Local is newer, push entire state up to align cloud
                                queueSettingsAction({
                                    type: 'UPDATE_SETTINGS',
                                    updates: {
                                        wallpaper: get().wallpaper,
                                        theme: get().theme,
                                        hideConfig: get().hideConfig
                                    }
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch settings from DB:", e);
                }
            }
        }),
        {
            name: 'settings-storage',
            onRehydrateStorage: () => (state) => {
                if (state) state.setHasHydrated(true);
            }
        }
    )
);