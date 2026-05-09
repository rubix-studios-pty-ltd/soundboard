import ElectronStore from 'electron-store'
import { defaultSettings } from '@/constants/settings'

import type { HotkeyMap } from '@/types'
import type { Settings } from '@/types/settings'

const Store = new ElectronStore<{
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

export default Store
