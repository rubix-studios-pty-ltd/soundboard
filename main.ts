import path from "path"

import type { BrowserWindow as BrowserWindowType } from "electron"
import { app, BrowserWindow, ipcMain, ProtocolRequest } from "electron"
import Store from "electron-store"

import type {
  HotkeyMap as HotkeyMapType,
  Settings as SettingsType,
} from "@/types"

const shouldLog = () => process.argv.includes("--enable-logging")

const DEFAULT_SETTINGS = {
  multiSoundEnabled: true,
  repeatSoundEnabled: false,
  alwaysOnTop: false,
  volume: 1,
  hideEnabled: false,
  hiddenSounds: [] as string[],
  colorEnabled: false,
  buttonColors: {},
  theme: {
    enabled: false,
    backgroundColor: "#f3f4f6",
    buttonColor: "#4b5563",
    buttonText: "#ffffff",
    buttonActive: "#374151",
    buttonHoverColor: "#404040",
  },
}

const store = new Store<{ hotkeys: HotkeyMapType; settings: SettingsType }>({
  schema: {
    hotkeys: {
      type: "object",
    },
    settings: {
      type: "object",
    },
  },
  defaults: {
    hotkeys: {},
    settings: DEFAULT_SETTINGS,
  },
})

try {
  const settings = store.get("settings")
  if (
    !settings ||
    typeof settings.volume !== "number" ||
    isNaN(settings.volume) ||
    settings.volume < 0 ||
    settings.volume > 1 ||
    !Array.isArray(settings.hiddenSounds) ||
    typeof settings.buttonColors !== "object" ||
    typeof settings.theme !== "object" ||
    typeof settings.theme?.buttonText !== "string" ||
    typeof settings.theme?.buttonActive !== "string"
  ) {
    store.set("settings", {
      ...DEFAULT_SETTINGS,
      ...settings,
      volume:
        settings &&
        typeof settings.volume === "number" &&
        !isNaN(settings.volume) &&
        settings.volume >= 0 &&
        settings.volume <= 1
          ? settings.volume
          : 1,
      hiddenSounds: Array.isArray(settings?.hiddenSounds)
        ? settings.hiddenSounds
        : [],
      buttonColors:
        typeof settings?.buttonColors === "object"
          ? settings.buttonColors || {}
          : {},
      theme:
        typeof settings?.theme === "object" &&
        typeof settings.theme?.buttonText === "string" &&
        typeof settings.theme?.buttonActive === "string"
          ? settings.theme
          : DEFAULT_SETTINGS.theme,
    })
  }
} catch (error) {
  if (shouldLog()) console.error("Error validating settings:", error)
  store.set("settings", DEFAULT_SETTINGS)
}

let win: BrowserWindowType | null = null
const ROOT_PATH = path.join(__dirname, "..")

function createWindow(): void {
  win = new BrowserWindow({
    width: 626,
    height: 1005,
    resizable: true,
    alwaysOnTop: store.get("settings")?.alwaysOnTop ?? false,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(ROOT_PATH, "dist", "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  })

  if (win) {
    win.once("ready-to-show", () => {
      win?.show()
    })

    const { protocol } = require("electron")
    protocol.handle("app", async (request: ProtocolRequest) => {
      const filePath = new URL(request.url).pathname
      const extension = path.extname(filePath).toLowerCase()

      const skipCompression = [".opus", ".mp3", ".ogg"].includes(extension)

      const compressionOptions = {
        enableBrotli: !skipCompression,
        enableGzip: !skipCompression,
      }

      try {
        return await protocol.Response.fromFileStream(
          path.join(ROOT_PATH, filePath),
          compressionOptions
        )
      } catch (error) {
        if (shouldLog()) console.error("Protocol handler error:", error)
        return new protocol.Response()
      }
    })

    win.loadFile(path.join(ROOT_PATH, "index.html"))

    if (process.argv.includes("--enable-logging")) {
      win.webContents.openDevTools()
    }
  }
}

function setupIPC(): void {
  ipcMain.handle("load-hotkeys", (): HotkeyMapType => {
    try {
      return store.get("hotkeys") ?? {}
    } catch (error) {
      if (shouldLog()) console.error("Error loading hotkeys:", error)
      return {}
    }
  })

  ipcMain.handle("load-settings", (): SettingsType => {
    try {
      return store.get("settings") ?? DEFAULT_SETTINGS
    } catch (error) {
      if (shouldLog()) console.error("Error loading settings:", error)
      return DEFAULT_SETTINGS
    }
  })

  ipcMain.on("save-hotkeys", (_: any, newHotkeys: HotkeyMapType) => {
    try {
      store.set("hotkeys", newHotkeys)
    } catch (error) {
      if (shouldLog()) console.error("Error saving hotkeys:", error)
    }
  })

  ipcMain.on("save-settings", (_: any, settings: SettingsType) => {
    try {
      const validatedSettings: SettingsType = {
        multiSoundEnabled: Boolean(settings.multiSoundEnabled),
        repeatSoundEnabled: Boolean(settings.repeatSoundEnabled),
        alwaysOnTop: Boolean(settings.alwaysOnTop),
        volume: Number(settings.volume),
        hideEnabled: Boolean(settings.hideEnabled),
        hiddenSounds: Array.isArray(settings.hiddenSounds)
          ? settings.hiddenSounds
          : [],
        colorEnabled: Boolean(settings.colorEnabled),
        buttonColors:
          typeof settings.buttonColors === "object"
            ? settings.buttonColors || {}
            : {},
        theme:
          typeof settings.theme === "object" &&
          typeof settings.theme?.buttonText === "string" &&
          typeof settings.theme?.buttonActive === "string" &&
          typeof settings.theme?.buttonColor === "string" &&
          typeof settings.theme?.backgroundColor === "string" &&
          typeof settings.theme?.buttonHoverColor === "string"
            ? settings.theme
            : DEFAULT_SETTINGS.theme,
      }

      if (
        isNaN(validatedSettings.volume) ||
        validatedSettings.volume < 0 ||
        validatedSettings.volume > 1
      ) {
        validatedSettings.volume = 1
      }

      store.set("settings", validatedSettings)
    } catch (error) {
      if (shouldLog()) console.error("Error saving settings:", error)
      try {
        store.set("settings", DEFAULT_SETTINGS)
      } catch (e) {
        if (shouldLog()) console.error("Failed to save default settings:", e)
      }
    }
  })

  ipcMain.on("toggle-always-on-top", (_: any, isEnabled: boolean) => {
    try {
      if (win) {
        win.setAlwaysOnTop(isEnabled)
        const currentSettings = store.get("settings") ?? DEFAULT_SETTINGS
        const updatedSettings = {
          ...currentSettings,
          alwaysOnTop: isEnabled,
          hideEnabled: currentSettings.hideEnabled ?? false,
          hiddenSounds: Array.isArray(currentSettings.hiddenSounds)
            ? currentSettings.hiddenSounds
            : [],
          colorEnabled: currentSettings.colorEnabled ?? false,
          buttonColors:
            typeof currentSettings.buttonColors === "object"
              ? currentSettings.buttonColors || {}
              : {},
          theme:
            typeof currentSettings.theme === "object" &&
            typeof currentSettings.theme?.buttonText === "string" &&
            typeof currentSettings.theme?.buttonActive === "string" &&
            typeof currentSettings.theme?.buttonColor === "string" &&
            typeof currentSettings.theme?.backgroundColor === "string" &&
            typeof currentSettings.theme?.buttonHoverColor === "string"
              ? currentSettings.theme
              : DEFAULT_SETTINGS.theme,
        }
        store.set("settings", updatedSettings)
      }
    } catch (error) {
      if (shouldLog()) {
        console.error("Error toggling always-on-top:", error)
      }
    }
  })
}

app.whenReady().then(() => {
  try {
    createWindow()
    setupIPC()
  } catch (error) {
    if (shouldLog()) console.error("Error during startup:", error)
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  win = null
  if (process.platform !== "darwin") {
    app.quit()
  }
})

process.on("uncaughtException", (error: Error) => {
  console.error("[Critical] Uncaught Exception:", error)
})

process.on("unhandledRejection", (error: Error | unknown) => {
  console.error("[Critical] Unhandled Rejection:", error)
})
