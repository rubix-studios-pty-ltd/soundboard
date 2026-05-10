import { type HotkeyMap } from '@/types/hotkeys'
import { type Settings } from '@/types/settings'
import { type SoundData } from '@/types/sound'

export interface IPC {
  on: (channel: string, listener: (...args: unknown[]) => void) => void
  off: (channel: string, listener: (...args: unknown[]) => void) => void
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
  stopAllSounds: () => void
  getAppDataPath: () => Promise<string>
  userSoundPath: (url: string) => Promise<string>
}
