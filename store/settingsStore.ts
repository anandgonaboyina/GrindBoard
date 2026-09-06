import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define only Settings-related types
interface SettingsState {
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    wallpaper: string;
    theme: 'light' | 'dark' | 'auto';
    hideConfig: Record<string, boolean>;

    // Local Media (Strictly client-side)
    customDesktopWallpapers: string[];

    // Actions
    setWallpaper: (url: string) => void;
    setTheme: (theme: 'light' | 'dark' | 'auto') => void;
    toggleWidget: (key: string, value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            wallpaper: '/wallpapers/naruto.webp',
            theme: 'dark',
            hideConfig: {},
            customDesktopWallpapers: [],

            // Surgical updates: Update UI instantly, then PATCH specific key to API
            setWallpaper: async (url) => {
                set({ wallpaper: url });
                const token = localStorage.getItem('dashboard_sync_token');
                if (token && navigator.onLine) {
                    fetch('/api/settings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ updates: { 'generalSettings.wallpaper': url } })
                    }).catch(console.error);
                }
            },

            setTheme: async (theme) => {
                set({ theme });
                // Add PATCH fetch here similar to setWallpaper
            },

            toggleWidget: async (key, value) => {
                set((state) => ({ hideConfig: { ...state.hideConfig, [key]: value } }));
                // Add PATCH fetch here similar to setWallpaper
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