export interface SoundData {
  id: string
  isUserAdded?: boolean
  file: string
  format?: 'opus' | 'mp3'
  frequent?: boolean
  title: string
}

export type SoundType = 'sound' | 'music'

export interface SoundsContextType {
  sounds: SoundData[]
  music: SoundData[]
  addSound: (sound: SoundData, type: SoundType) => Promise<void>
  removeSound: (sound: SoundData, type: SoundType) => Promise<void>
  isLoading: boolean
}
