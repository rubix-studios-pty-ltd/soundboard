export interface Pool {
  audio: HTMLAudioElement
  source: string
  isPlaying: boolean
  cleanupListeners: (() => void)[]
  onEnd?: () => void
  lastUsed: number
  duration?: number
}
