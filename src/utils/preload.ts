import { contextBridge, ipcRenderer } from "electron"

import type { HotkeyMap, IpcApi, Settings } from "@/types"

const electronAPI: IpcApi = {
  loadSounds: async (type: "sound" | "music") => {
    try {
      return await ipcRenderer.invoke("load-sounds", type)
    } catch (error) {
      console.error(`Error loading ${type}s:`, error)
      return []
    }
  },
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
        maxPoolSize: 100,
        maxInstancesPerSound: 20,
        buttonSettings: false,
        hiddenSounds: [],
        buttonColors: {},
        dragAndDropEnabled: false,
        favorites: {
          items: [],
          maxItems: 12,
        },
        theme: {
          enabled: false,
          backgroundColor: "#f3f4f6",
          buttonColor: "#4b5563",
          buttonText: "#ffffff",
          buttonActive: "#374151",
          buttonHoverColor: "#404040",
        },
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

  convertAudio: async (params) => {
    try {
      return await ipcRenderer.invoke("convert-audio", params)
    } catch (error) {
      console.error("Error converting audio:", error)
      throw error
    }
  },

  addSound: async (params) => {
    try {
      await ipcRenderer.invoke("add-sound", params)
    } catch (error) {
      console.error("Error adding sound:", error)
      throw error
    }
  },

  deleteSound: async (params) => {
    try {
      await ipcRenderer.invoke("delete-sound", params)
    } catch (error) {
      console.error("Error deleting sound:", error)
      throw error
    }
  },

  validateSound: async (sound) => {
    try {
      return await ipcRenderer.invoke("validate-sound", sound)
    } catch (error) {
      console.error("Error validating sound:", error)
      return false
    }
  },

  getAppDataPath: async () => {
    try {
      return await ipcRenderer.invoke("get-app-data-path")
    } catch (error) {
      console.error("Error getting app data path:", error)
      throw error
    }
  },
}

contextBridge.exposeInMainWorld("electronAPI", electronAPI)
