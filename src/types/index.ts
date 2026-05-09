import type { Settings } from '@/types/settings'

export interface SoundData {
  id: string
  file: string
  title: string
  frequent?: boolean
  isUserAdded?: boolean
  format?: 'opus' | 'mp3'
}

export interface HotkeyMap {
  [soundId: string]: string
}

export interface AudioPoolItem {
  audio: HTMLAudioElement
  isPlaying: boolean
}

export interface IpcApi {
  on: (channel: string, listener: (...args: any[]) => void) => void
  off: (channel: string, listener: (...args: any[]) => void) => void
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  windowControl: (action: string, target?: string) => void
  loadHotkeys: () => Promise<HotkeyMap>
  loadSettings: () => Promise<Settings>
  saveHotkeys: (hotkeys: HotkeyMap) => void
  saveSettings: (settings: Settings) => void
  toggleAlwaysOnTop: (isEnabled: boolean) => void
  loadSounds: (type: 'sound' | 'music') => Promise<SoundData[]>
  convertAudio: (params: {
    buffer: ArrayBuffer
    originalName: string
    type: 'sound' | 'music'
  }) => Promise<{ outputPath: string }>
  addSound: (params: { sound: SoundData; type: 'sound' | 'music' }) => Promise<void>
  deleteSound: (params: { sound: SoundData; type: 'sound' | 'music' }) => Promise<void>
  validateSound: (sound: SoundData) => Promise<boolean>
  getAppDataPath: () => Promise<string>
  resolveUserSoundPath: (url: string) => Promise<string>
}

declare global {
  interface Window {
    electronAPI: IpcApi
  }
}
