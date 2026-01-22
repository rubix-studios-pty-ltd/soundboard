import ElectronStore from 'electron-store'
import { defaultSettings } from '@/constants/settings'

import type { HotkeyMap as HotkeyMapType, Settings as SettingsType } from '@/types'

const Store = new ElectronStore<{
  hotkeys: HotkeyMapType
  settings: SettingsType
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

export default Store
