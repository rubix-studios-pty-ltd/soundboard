import { contextBridge, ipcRenderer } from "electron"

import type { HotkeyMap, IpcApi, Settings } from "@/types"

const electronAPI: IpcApi = {
  minimizeWindow: () => {
    try {
      ipcRenderer.send("window-control", "minimize")
    } catch (error) {
      console.error("Error minimizing window:", error)
    }
  },
  maximizeWindow: () => {
    try {
      ipcRenderer.send("window-control", "maximize")
    } catch (error) {
      console.error("Error maximizing window:", error)
    }
  },
  closeWindow: () => {
    try {
      ipcRenderer.send("window-control", "close")
    } catch (error) {
      console.error("Error closing window:", error)
    }
  },
  loadHotkeys: async () => {
    try {
      return await ipcRenderer.invoke("load-hotkeys")
    } catch (error) {
      console.error("Error loading hotkeys:", error)
      return {}
    }
  },

  loadSettings: async () => {
    try {
      return await ipcRenderer.invoke("load-settings")
    } catch (error) {
      console.error("Error loading settings:", error)
      return {
        multiSoundEnabled: true,
        repeatSoundEnabled: false,
        alwaysOnTop: false,
        volume: 1,
      }
    }
  },

  saveHotkeys: (hotkeys: HotkeyMap) => {
    try {
      ipcRenderer.send("save-hotkeys", hotkeys)
    } catch (error) {
      console.error("Error saving hotkeys:", error)
    }
  },

  saveSettings: (settings: Settings) => {
    try {
      ipcRenderer.send("save-settings", settings)
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  },

  toggleAlwaysOnTop: (isEnabled: boolean) => {
    try {
      ipcRenderer.send("toggle-always-on-top", isEnabled)
    } catch (error) {
      console.error("Error toggling always-on-top:", error)
    }
  },
}

contextBridge.exposeInMainWorld("electronAPI", electronAPI)
