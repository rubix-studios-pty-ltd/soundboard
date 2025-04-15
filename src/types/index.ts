export interface Settings {
  multiSoundEnabled: boolean
  repeatSoundEnabled: boolean
  alwaysOnTop: boolean
  volume: number
  maxPoolSize: number
  maxInstancesPerSound: number
  buttonSettings: boolean
  hiddenSounds: string[]
  buttonColors: { [soundId: string]: string | undefined }
  dragAndDropEnabled: boolean
  favorites: {
    items: string[]
    maxItems: number
  }
  theme: {
    enabled: boolean
    backgroundColor: string
    buttonColor: string
    buttonText: string
    buttonActive: string
    buttonHoverColor: string
  }
}

export interface SoundData {
  id?: string
  file: string
  title: string
  frequent?: boolean
  isUserAdded?: boolean
  format?: "opus" | "mp3"
}

export interface HotkeyMap {
  [soundId: string]: string
}

export interface AudioPoolItem {
  audio: HTMLAudioElement
  isPlaying: boolean
}

export interface IpcApi {
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  loadHotkeys: () => Promise<HotkeyMap>
  loadSettings: () => Promise<Settings>
  saveHotkeys: (hotkeys: HotkeyMap) => void
  saveSettings: (settings: Settings) => void
  toggleAlwaysOnTop: (isEnabled: boolean) => void
  convertAudio: (params: {
    buffer: ArrayBuffer
    originalName: string
    type: "sound" | "music"
  }) => Promise<{ outputPath: string }>
  addSound: (params: {
    sound: SoundData
    type: "sound" | "music"
  }) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: IpcApi
  }
}
