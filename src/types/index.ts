export interface Settings {
    multiSoundEnabled: boolean;
    repeatSoundEnabled: boolean;
    alwaysOnTop: boolean;
    volume: number;
}

export interface SoundData {
    id: string;
    file: string;
    title: string;
}

export interface HotkeyMap {
    [soundId: string]: string;
}

export interface AudioPoolItem {
    audio: HTMLAudioElement;
    isPlaying: boolean;
}

// Note: IpcApi and Window.electronAPI have been removed as we're now using Tauri's invoke system
// See tauri-api.ts for the Tauri-specific implementation
