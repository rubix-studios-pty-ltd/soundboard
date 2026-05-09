export interface Settings {
  enableMulti: boolean
  enableRepeat: boolean
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
  popoutGrid: {
    items: string[]
    maxItems: number
    window: {
      isOpen: boolean
      showOnStartup: boolean
    }
  }
  showSoundGrid: boolean
  showMusicGrid: boolean
}
