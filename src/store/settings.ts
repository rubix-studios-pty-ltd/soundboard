import Store from 'electron-store'

import { defaultSettings } from '@/constants/settings'
import { type HotkeyMap } from '@/types/hotkeys'
import { type Settings } from '@/types/settings'

export const Electron = new Store<{
  hotkeys: HotkeyMap
  settings: Settings
}>({
  schema: {
    hotkeys: {
      type: 'object',
    },
    settings: {
      type: 'object',
    },
  },
  defaults: {
    hotkeys: {},
    settings: defaultSettings,
  },
})
