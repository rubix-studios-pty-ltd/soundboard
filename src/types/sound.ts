export interface SoundData {
  id: string
  file: string
  title: string
  frequent?: boolean
  isUserAdded?: boolean
  format?: 'opus' | 'mp3'
}
