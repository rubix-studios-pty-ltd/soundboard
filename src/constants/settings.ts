import type { Settings } from "@/types"

export const defaultSettings: Settings = {
  multiSoundEnabled: true,
  repeatSoundEnabled: false,
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
    backgroundColor: "#f3f4f6",
    buttonColor: "#4b5563",
    buttonText: "#ffffff",
    buttonActive: "#374151",
    buttonHoverColor: "#404040",
  },
  popoutGrid: {
    items: [],
    maxItems: 18,
    window: {
      x: 100,
      y: 100,
      width: 228,
      height: 360,
      isOpen: false,
      showOnStartup: false,
    },
  },
  showSoundGrid: true,
  showMusicGrid: true,
}
