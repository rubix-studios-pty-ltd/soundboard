import { type Settings } from '@/types/settings'

export const maxPool = 100
export const maxInstance = 10
export const maxFavorites = 18
export const maxPopout = 42

export const defaultSettings: Settings = {
  enableMulti: true,
  enableRepeat: false,
  alwaysOnTop: false,
  volume: 1,
  maxPoolSize: maxPool,
  maxInstancesPerSound: maxInstance,
  buttonSettings: false,
  hiddenSounds: [] as string[],
  buttonColors: {},
  dragAndDropEnabled: false,
  favorites: {
    items: [],
    maxItems: maxFavorites,
  },
  theme: {
    enabled: false,
    backgroundColor: '#f3f4f6',
    buttonColor: '#4b5563',
    buttonText: '#ffffff',
    buttonActive: '#374151',
    buttonHoverColor: '#404040',
  },
  popoutGrid: {
    items: [],
    maxItems: maxPopout,
    window: {
      isOpen: false,
      showOnStartup: false,
    },
  },
  showSoundGrid: true,
  showMusicGrid: true,
}
