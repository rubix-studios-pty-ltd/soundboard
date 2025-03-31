// Settings types
export interface Settings {
    multiSoundEnabled: boolean;
    repeatSoundEnabled: boolean;
    alwaysOnTop: boolean;
    volume: number;
}

// Sound types
export interface SoundData {
    id: string;
    file: string;
    title: string;
}

// Hotkey types
export interface HotkeyMap {
    [soundId: string]: string;
}

// Audio types
export interface AudioPoolItem {
    audio: HTMLAudioElement;
    isPlaying: boolean;
}

// IPC types
export interface IpcApi {
    loadHotkeys: () => Promise<HotkeyMap>;
    loadSettings: () => Promise<Settings>;
    saveHotkeys: (hotkeys: HotkeyMap) => void;
    saveSettings: (settings: Settings) => void;
    toggleAlwaysOnTop: (isEnabled: boolean) => void;
}

// Window types
declare global {
    interface Window {
        electronAPI: IpcApi;
    }
}
