import { invoke } from '@tauri-apps/api/core';
import { type Settings, type HotkeyMap } from '@/types';

export const tauriAPI = {
    loadSettings: async (): Promise<Settings> => {
        try {
            const settings: Settings = await invoke('load_settings');
            return settings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                multiSoundEnabled: true,
                repeatSoundEnabled: false,
                alwaysOnTop: false,
                volume: 1
            };
        }
    },

    saveSettings: async (settings: Settings): Promise<void> => {
        try {
            await invoke('save_settings', { settings });
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    },

    loadHotkeys: async (): Promise<HotkeyMap> => {
        try {
            const hotkeys: HotkeyMap = await invoke('load_hotkeys');
            return hotkeys;
        } catch (error) {
            console.error('Error loading hotkeys:', error);
            return {};
        }
    },

    saveHotkeys: async (hotkeys: HotkeyMap): Promise<void> => {
        try {
            await invoke('save_hotkeys', { hotkeys });
        } catch (error) {
            console.error('Error saving hotkeys:', error);
            throw error;
        }
    },

    toggleAlwaysOnTop: async (isEnabled: boolean): Promise<void> => {
        try {
            await invoke('toggle_always_on_top', { enabled: isEnabled });
        } catch (error) {
            console.error('Error toggling always-on-top:', error);
            throw error;
        }
    }
};
