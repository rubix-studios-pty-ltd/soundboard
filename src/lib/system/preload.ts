import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { contextBridge, ipcRenderer } from 'electron'

import { defaultSettings } from '@/constants/settings'
import { type HotkeyMap } from '@/types/hotkeys'
import { type IPC } from '@/types/ipc'
import { type Settings } from '@/types/settings'

const listeners = new Map<
  (...args: unknown[]) => void,
  (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
>()

const electronAPI: IPC = {
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      listener(...args)
    }

    listeners.set(listener, subscription)

    ipcRenderer.on(channel, subscription)
  },

  off: (channel: string, listener: (...args: unknown[]) => void) => {
    const subscription = listeners.get(listener)

    if (!subscription) {
      return
    }

    ipcRenderer.removeListener(channel, subscription)

    listeners.delete(listener)
  },

  loadSounds: async (type: 'sound' | 'music') => {
    try {
      return await ipcRenderer.invoke('load-sounds', type)
    } catch (error) {
      console.error(`Error loading ${type}s:`, error)
      return []
    }
  },

  minimizeWindow: () => {
    try {
      ipcRenderer.send('window-control', 'minimize')
    } catch (error) {
      console.error('Error minimizing window:', error)
    }
  },

  windowControl: (action: string, target?: string) => {
    try {
      ipcRenderer.send('window-control', action, target)
    } catch (error) {
      console.error('Error controlling window:', error)
    }
  },

  maximizeWindow: () => {
    try {
      ipcRenderer.send('window-control', 'maximize')
    } catch (error) {
      console.error('Error maximizing window:', error)
    }
  },

  closeWindow: () => {
    try {
      ipcRenderer.send('window-control', 'close')
    } catch (error) {
      console.error('Error closing window:', error)
    }
  },

  loadHotkeys: async () => {
    try {
      return await ipcRenderer.invoke('load-hotkeys')
    } catch (error) {
      console.error('Error loading hotkeys:', error)
      return {}
    }
  },

  loadSettings: async () => {
    try {
      return await ipcRenderer.invoke('load-settings')
    } catch (error) {
      console.error('Error loading settings:', error)
      return defaultSettings
    }
  },

  saveHotkeys: (hotkeys: HotkeyMap) => {
    try {
      ipcRenderer.send('save-hotkeys', hotkeys)
    } catch (error) {
      console.error('Error saving hotkeys:', error)
    }
  },

  saveSettings: (settings: Settings) => {
    try {
      ipcRenderer.send('save-settings', settings)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  },

  toggleAlwaysOnTop: (isEnabled: boolean) => {
    try {
      ipcRenderer.send('toggle-always-on-top', isEnabled)
    } catch (error) {
      console.error('Error toggling always-on-top:', error)
    }
  },

  convertAudio: async (params) => {
    try {
      return await ipcRenderer.invoke('convert-audio', params)
    } catch (error) {
      console.error('Error converting audio:', error)
      throw error
    }
  },

  addSound: async (params) => {
    try {
      await ipcRenderer.invoke('add-sound', params)
    } catch (error) {
      console.error('Error adding sound:', error)
      throw error
    }
  },

  deleteSound: async (params) => {
    try {
      await ipcRenderer.invoke('delete-sound', params)
    } catch (error) {
      console.error('Error deleting sound:', error)
      throw error
    }
  },

  validateSound: async (sound) => {
    try {
      return await ipcRenderer.invoke('validate-sound', sound)
    } catch (error) {
      console.error('Error validating sound:', error)
      return false
    }
  },

  getAppDataPath: async () => {
    try {
      return await ipcRenderer.invoke('get-app-data-path')
    } catch (error) {
      console.error('Error getting app data path:', error)
      throw error
    }
  },

  userSoundPath: async (url: string) => {
    try {
      const userDataPath = await ipcRenderer.invoke('get-app-data-path')
      const filePath = path.normalize(path.join(userDataPath, 'sounds', url))
      return pathToFileURL(filePath).href
    } catch (error) {
      console.error('Error resolving user sound path:', error)
      return url
    }
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
