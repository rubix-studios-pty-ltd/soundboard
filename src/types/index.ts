export interface Settings {
  multiSoundEnabled: boolean
  repeatSoundEnabled: boolean
  alwaysOnTop: boolean
  volume: number
  maxPoolSize: number
  maxInstancesPerSound: number
  hideEnabled: boolean
  hiddenSounds: string[]
  colorEnabled: boolean
  buttonColors: { [soundId: string]: string | undefined }
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
}

declare global {
  interface Window {
    electronAPI: IpcApi
  }
}
