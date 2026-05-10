import { type Settings } from '@/types/settings'

export const defaultSettings: Settings = {
  enableMulti: true,
  enableRepeat: false,
  alwaysOnTop: false,
  volume: 1,
  maxPoolSize: 100,
  maxInstancesPerSound: 20,
  buttonSettings: false,
  hiddenSounds: [] as string[],
  buttonColors: {},
  dragAndDropEnabled: false,
  favorites: {
    items: [],
    maxItems: 18,
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
    maxItems: 42,
    window: {
      isOpen: false,
      showOnStartup: false,
    },
  },
  showSoundGrid: true,
  showMusicGrid: true,
}
