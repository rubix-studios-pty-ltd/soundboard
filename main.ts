import { promises as fs } from "fs"
import path from "path"

import type { BrowserWindow as BrowserWindowType } from "electron"
import { app, BrowserWindow, ipcMain, ProtocolRequest } from "electron"
import Store from "electron-store"
import ffmpeg from "fluent-ffmpeg"

import type {
  HotkeyMap as HotkeyMapType,
  Settings as SettingsType,
  SoundData,
} from "@/types"

const shouldLog = () => process.argv.includes("--enable-logging")

const defaultSettings: SettingsType = {
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
    settings: defaultSettings,
  },
})

async function manageSoundsJson(type: "sound" | "music") {
  const jsonPath = path.join(app.getPath("userData"), `${type}s.json`)
  let sounds: SoundData[] = []
  
  try {
    const exists = await fs.access(jsonPath).then(() => true).catch(() => false)
    if (exists) {
      const content = await fs.readFile(jsonPath, 'utf-8')
      sounds = JSON.parse(content)
    }
  } catch (error) {
    if (shouldLog()) console.error("Error reading sounds JSON:", error)
  }
  
  return {
    getAll: () => sounds,
    add: async (sound: SoundData) => {
      sounds.push(sound)
      await fs.writeFile(jsonPath, JSON.stringify(sounds, null, 2), 'utf-8')
    }
  }
}

try {
  const settings = store.get("settings")
  if (
    !settings ||
    typeof settings.volume !== "number" ||
    isNaN(settings.volume) ||
    settings.volume < 0 ||
    settings.volume > 1 ||
    typeof settings.maxPoolSize !== "number" ||
    isNaN(settings.maxPoolSize) ||
    typeof settings.maxInstancesPerSound !== "number" ||
    isNaN(settings.maxInstancesPerSound) ||
    !Array.isArray(settings.hiddenSounds) ||
    typeof settings.buttonColors !== "object" ||
    typeof settings.theme !== "object" ||
    typeof settings.theme?.buttonText !== "string" ||
    typeof settings.theme?.buttonActive !== "string"
  ) {
    store.set("settings", {
      ...defaultSettings,
      ...settings,
      volume:
        settings &&
        typeof settings.volume === "number" &&
        !isNaN(settings.volume) &&
        settings.volume >= 0 &&
        settings.volume <= 1
          ? settings.volume
          : 1,
      maxPoolSize:
        settings &&
        typeof settings.maxPoolSize === "number" &&
        !isNaN(settings.maxPoolSize)
          ? settings.maxPoolSize
          : 100,
      maxInstancesPerSound:
        settings &&
        typeof settings.maxInstancesPerSound === "number" &&
        !isNaN(settings.maxInstancesPerSound)
          ? settings.maxInstancesPerSound
          : 20,
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
          : defaultSettings.theme,
    })
  }
} catch (error) {
  if (shouldLog()) {
    console.error("Error validating settings:", error)
  }
  store.set("settings", defaultSettings)
}

let win: BrowserWindowType | null = null
const ROOT_PATH = path.join(__dirname, "..")

function createWindow(): void {
  win = new BrowserWindow({
    width: 612,
    height: 940,
    resizable: true,
    alwaysOnTop: store.get("settings")?.alwaysOnTop ?? false,
    frame: false,
    titleBarStyle: "hidden",
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
        const soundPath = path.join(app.getPath("userData"), filePath)
        try {
          await fs.access(soundPath)
          return await protocol.Response.fromFileStream(
            soundPath,
            compressionOptions
          )
        } catch {
          return await protocol.Response.fromFileStream(
            path.join(ROOT_PATH, filePath),
            compressionOptions
          )
        }
      } catch (error) {
        if (shouldLog()) {
          console.error("Protocol handler error:", error)
        }
        return new protocol.Response()
      }
    })

    win.loadFile(path.join(ROOT_PATH, "index.html"))

    if (process.argv.includes("--enable-logging")) {
      win.webContents.openDevTools()
    }
  }
}

async function convertToOpus(
  filePath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .toFormat("opus")
      .audioFilters([
        "loudnorm=I=-16:TP=-1.5:LRA=11",
        "dynaudnorm=f=150:g=5",
        "silenceremove=1:0:-50dB"
      ])
      .audioFrequency(48000)
      .audioBitrate("64k")
      .outputOptions(["-map_metadata", "-1"])
      .save(outputPath)
      .on("end", resolve)
      .on("error", reject)
  })
}

function setupIPC(): void {
  ipcMain.handle("load-sounds", async (_, type: "sound" | "music") => {
    const manager = await manageSoundsJson(type)
    return manager.getAll()
  })

  ipcMain.on("window-control", (_: any, action: string) => {
    try {
      if (!win) {
        return
      }

      switch (action) {
        case "minimize":
          win.minimize()
          break
        case "maximize":
          if (win.isMaximized()) {
            win.unmaximize()
          } else {
            win.maximize()
          }
          break
        case "close":
          win.close()
          break
      }
    } catch (error) {
      if (shouldLog()) {
        console.error("Error handling window control:", error)
      }
    }
  })

  ipcMain.handle("load-hotkeys", (): HotkeyMapType => {
    try {
      return store.get("hotkeys") ?? {}
    } catch (error) {
      if (shouldLog()) {
        console.error("Error loading hotkeys:", error)
      }
      return {}
    }
  })

  ipcMain.handle("load-settings", (): SettingsType => {
    try {
      return store.get("settings") ?? defaultSettings
    } catch (error) {
      if (shouldLog()) {
        console.error("Error loading settings:", error)
      }
      return defaultSettings
    }
  })

  ipcMain.on("save-hotkeys", (_: any, newHotkeys: HotkeyMapType) => {
    try {
      store.set("hotkeys", newHotkeys)
    } catch (error) {
      if (shouldLog()) {
        console.error("Error saving hotkeys:", error)
      }
    }
  })

  ipcMain.on("save-settings", (_: any, settings: SettingsType) => {
    try {
      const validatedSettings: SettingsType = {
        multiSoundEnabled: Boolean(settings.multiSoundEnabled),
        repeatSoundEnabled: Boolean(settings.repeatSoundEnabled),
        alwaysOnTop: Boolean(settings.alwaysOnTop),
        volume: Number(settings.volume),
        maxPoolSize:
          settings.maxPoolSize === undefined ||
          isNaN(Number(settings.maxPoolSize))
            ? 100
            : Number(settings.maxPoolSize),
        maxInstancesPerSound: Number(settings.maxInstancesPerSound) || 20,
        buttonSettings: Boolean(settings.buttonSettings),
        hiddenSounds: Array.isArray(settings.hiddenSounds)
          ? settings.hiddenSounds
          : [],
        buttonColors:
          typeof settings.buttonColors === "object"
            ? settings.buttonColors || {}
            : {},
        dragAndDropEnabled: Boolean(settings.dragAndDropEnabled),
        favorites: {
          items: Array.isArray(settings.favorites?.items)
            ? settings.favorites.items
            : [],
          maxItems: Number(settings.favorites?.maxItems) || 12,
        },
        theme:
          typeof settings.theme === "object" &&
          typeof settings.theme?.buttonText === "string" &&
          typeof settings.theme?.buttonActive === "string" &&
          typeof settings.theme?.buttonColor === "string" &&
          typeof settings.theme?.backgroundColor === "string" &&
          typeof settings.theme?.buttonHoverColor === "string"
            ? settings.theme
            : defaultSettings.theme,
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
      if (shouldLog()) {
        console.error("Error saving settings:", error)
      }
      try {
        store.set("settings", defaultSettings)
      } catch (e) {
        if (shouldLog()) {
          console.error("Failed to save default settings:", e)
        }
      }
    }
  })

  ipcMain.on("toggle-always-on-top", (_: any, isEnabled: boolean) => {
    try {
      if (win) {
        win.setAlwaysOnTop(isEnabled)
        const currentSettings = store.get("settings") ?? defaultSettings
        const updatedSettings = {
          ...currentSettings,
          alwaysOnTop: isEnabled,
          maxPoolSize: Number(currentSettings.maxPoolSize) || 100,
          maxInstancesPerSound:
            Number(currentSettings.maxInstancesPerSound) || 20,
          buttonSettings: currentSettings.buttonSettings ?? false,
          hiddenSounds: Array.isArray(currentSettings.hiddenSounds)
            ? currentSettings.hiddenSounds
            : [],
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
              : defaultSettings.theme,
          dragAndDropEnabled: Boolean(currentSettings.dragAndDropEnabled),
          favorites: {
            items: Array.isArray(currentSettings.favorites?.items)
              ? currentSettings.favorites.items
              : [],
            maxItems: Number(currentSettings.favorites?.maxItems) || 12,
          },
        }
        store.set("settings", updatedSettings)
      }
    } catch (error) {
      if (shouldLog()) {
        console.error("Error toggling always-on-top:", error)
      }
    }
  })

  ipcMain.handle(
    "convert-audio",
    async (
      _,
      params: { buffer: ArrayBuffer; originalName: string; type: "sound" | "music" }
    ) => {
      try {
        const tempDir = path.join(app.getPath("userData"), "temp")
        await fs.mkdir(tempDir, { recursive: true })

        // Create sounds directory in AppData
        const soundsDir = path.join(app.getPath("userData"), "sounds")
        await fs.mkdir(soundsDir, { recursive: true })

        const inputPath = path.join(tempDir, params.originalName)
        const outputName =
          path.basename(
            params.originalName,
            path.extname(params.originalName)
          ) + ".opus"
        const outputPath = path.join(soundsDir, outputName)

        // Write the buffer directly to the input file
        await fs.writeFile(inputPath, Buffer.from(params.buffer))

        await convertToOpus(inputPath, outputPath)

        // Clean up temp file
        await fs.unlink(inputPath)

        // Return path relative to sounds dir
        return { outputPath: path.join("sounds", outputName) }
      } catch (error) {
        if (shouldLog()) {
          console.error("Error converting audio:", error)
        }
        throw error
      }
    }
  )

  ipcMain.handle(
    "add-sound",
    async (_, params: { sound: SoundData; type: "sound" | "music" }) => {
      try {
        const manager = await manageSoundsJson(params.type)
        await manager.add(params.sound)
      } catch (error) {
        if (shouldLog()) {
          console.error("Error adding sound:", error)
        }
        throw error
      }
    }
  )
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
    if (win) {
      if (win.isMinimized()) {
        win.restore()
      }
      win.focus()
    }
  })

  app.whenReady().then(() => {
    try {
      createWindow()
      setupIPC()
    } catch (error) {
      if (shouldLog()) {
        console.error("Error during startup:", error)
      }
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

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
