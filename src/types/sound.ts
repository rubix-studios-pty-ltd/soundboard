export interface SoundData {
  id: string
  isUserAdded?: boolean
  file: string
  format?: 'opus' | 'mp3'
  frequent?: boolean
  title: string
}
