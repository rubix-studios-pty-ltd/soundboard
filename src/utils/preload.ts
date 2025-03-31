import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi, Settings, HotkeyMap } from '@/types';

const electronAPI: IpcApi = {
    loadHotkeys: async () => {
        try {
            return await ipcRenderer.invoke('load-hotkeys');
        } catch (error) {
            console.error('Error loading hotkeys:', error);
            return {};
        }
    },

    loadSettings: async () => {
        try {
            return await ipcRenderer.invoke('load-settings');
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

    saveHotkeys: (hotkeys: HotkeyMap) => {
        try {
            ipcRenderer.send('save-hotkeys', hotkeys);
        } catch (error) {
            console.error('Error saving hotkeys:', error);
        }
    },

    saveSettings: (settings: Settings) => {
        try {
            ipcRenderer.send('save-settings', settings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    },

    toggleAlwaysOnTop: (isEnabled: boolean) => {
        try {
            ipcRenderer.send('toggle-always-on-top', isEnabled);
        } catch (error) {
            console.error('Error toggling always-on-top:', error);
        }
    }
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
