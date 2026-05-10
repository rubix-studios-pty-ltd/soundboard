import {
  defaultSettings,
  maxFavorites,
  maxInstance,
  maxPool,
  maxPopout,
} from '@/constants/settings'
import { type Settings } from '@/types/settings'

export function savedSettings(raw: unknown): Settings {
  const setting = typeof raw === 'object' && raw ? (raw as Partial<Settings>) : {}

  return {
    enableMulti: Boolean(setting.enableMulti),
    enableRepeat: Boolean(setting.enableRepeat),
    alwaysOnTop: Boolean(setting.alwaysOnTop),
    volume: Number.isFinite(Number(setting.volume))
      ? Number(setting.volume)
      : defaultSettings.volume,
    maxPoolSize: maxPool,
    maxInstancesPerSound: maxInstance,
    buttonSettings: Boolean(setting.buttonSettings),
    hiddenSounds: Array.isArray(setting.hiddenSounds) ? setting.hiddenSounds : [],
    buttonColors:
      typeof setting.buttonColors === 'object' && setting.buttonColors
        ? setting.buttonColors || {}
        : {},
    dragAndDropEnabled: Boolean(setting.dragAndDropEnabled),
    favorites: {
      items: Array.isArray(setting.favorites?.items) ? setting.favorites?.items : [],
      maxItems: maxFavorites,
    },
    theme: (setting.theme as Settings['theme']) || defaultSettings.theme,
    popoutGrid: {
      items: Array.isArray(setting.popoutGrid?.items) ? setting.popoutGrid?.items : [],
      maxItems: maxPopout,
      window: {
        isOpen: Boolean(setting.popoutGrid?.window?.isOpen),
        showOnStartup: Boolean(setting.popoutGrid?.window?.showOnStartup),
      },
    },
    showSoundGrid: Boolean(setting.showSoundGrid),
    showMusicGrid: Boolean(setting.showMusicGrid),
  }
}
