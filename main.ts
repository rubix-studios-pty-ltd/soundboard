import { promises as fs } from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow, type IpcMainEvent, ipcMain } from 'electron'
import { defaultSettings } from '@/constants/settings'
import { setIsQuitting } from '@/store/quitting'
import Store from '@/store/settings'
import type { HotkeyMap, SoundData } from '@/types'
import type { Settings } from '@/types/settings'
import { convertToOpus } from '@/utils/audio/ffmpeg'
import { createSoundsManager } from '@/utils/sound/manager'
import { createWindow, win } from '@/window/main'
import { createPopoutWindow, popoutWin } from '@/window/popup'

const shouldLog = () => process.argv.includes('--enable-logging')

const soundManagers = {
  sound: createSoundsManager('sound'),
  music: createSoundsManager('music'),
}

try {
  const settings = Store.get('settings')
  if (
    !settings ||
    typeof settings.volume !== 'number' ||
    Number.isNaN(settings.volume) ||
    settings.volume < 0 ||
    settings.volume > 1 ||
    typeof settings.maxPoolSize !== 'number' ||
    Number.isNaN(settings.maxPoolSize) ||
    typeof settings.maxInstancesPerSound !== 'number' ||
    Number.isNaN(settings.maxInstancesPerSound) ||
    !Array.isArray(settings.hiddenSounds) ||
    typeof settings.buttonColors !== 'object' ||
    typeof settings.theme !== 'object' ||
    typeof settings.theme?.buttonText !== 'string' ||
    typeof settings.theme?.buttonActive !== 'string'
  ) {
    Store.set('settings', {
      ...defaultSettings,
      ...settings,
      volume:
        settings &&
        typeof settings.volume === 'number' &&
        !Number.isNaN(settings.volume) &&
        settings.volume >= 0 &&
        settings.volume <= 1
          ? settings.volume
          : 1,
      maxPoolSize:
        settings && typeof settings.maxPoolSize === 'number' && !Number.isNaN(settings.maxPoolSize)
          ? settings.maxPoolSize
          : 100,
      maxInstancesPerSound:
        settings &&
        typeof settings.maxInstancesPerSound === 'number' &&
        !Number.isNaN(settings.maxInstancesPerSound)
          ? settings.maxInstancesPerSound
          : 20,
      hiddenSounds: Array.isArray(settings?.hiddenSounds) ? settings.hiddenSounds : [],
      buttonColors: typeof settings?.buttonColors === 'object' ? settings.buttonColors || {} : {},
      theme:
        typeof settings?.theme === 'object' &&
        typeof settings.theme?.buttonText === 'string' &&
        typeof settings.theme?.buttonActive === 'string'
          ? settings.theme
          : defaultSettings.theme,
    })
  }
} catch (error) {
  if (shouldLog()) {
    console.error('Error validating settings:', error)
  }
  Store.set('settings', defaultSettings)
}

function setupIPC(): void {
  ipcMain.handle('load-sounds', async (_, type: 'sound' | 'music') => {
    return await soundManagers[type].getAll()
  })

  ipcMain.on('window-control', (_event: IpcMainEvent, action: string, target: string = 'main') => {
    try {
      const targetWindow = target === 'popout' ? popoutWin : win
      if (!targetWindow) {
        return
      }

      switch (action) {
        case 'minimize':
          targetWindow.minimize()
          break
        case 'maximize':
          if (targetWindow.isMaximized()) {
            targetWindow.unmaximize()
          } else {
            targetWindow.maximize()
          }
          break
        case 'close':
          if (target === 'popout') {
            targetWindow.hide()
            const settings = Store.get('settings')
            Store.set('settings', {
              ...settings,
              popoutGrid: {
                ...settings.popoutGrid,
                window: {
                  ...settings.popoutGrid.window,
                  isOpen: false,
                },
              },
            })
          } else {
            setIsQuitting(true)
            cleanupWindows()
            cleanupIPC()
            app.quit()
          }
          break
        case 'show':
          if (target === 'popout') {
            const settings = Store.get('settings')
            targetWindow.setAlwaysOnTop(settings?.alwaysOnTop ?? false)
            targetWindow.show()
            Store.set('settings', {
              ...settings,
              popoutGrid: {
                ...settings.popoutGrid,
                window: {
                  ...settings.popoutGrid.window,
                  isOpen: true,
                },
              },
            })
          }
          break
      }
    } catch (error) {
      if (shouldLog()) {
        console.error('Error handling window control:', error)
      }
    }
  })

  ipcMain.handle('load-hotkeys', (): HotkeyMap => {
    try {
      return Store.get('hotkeys') ?? {}
    } catch (error) {
      if (shouldLog()) {
        console.error('Error loading hotkeys:', error)
      }
      return {}
    }
  })

  ipcMain.handle('load-settings', (): Settings => {
    try {
      return Store.get('settings') ?? defaultSettings
    } catch (error) {
      if (shouldLog()) {
        console.error('Error loading settings:', error)
      }
      return defaultSettings
    }
  })

  ipcMain.on('save-hotkeys', (_event: IpcMainEvent, newHotkeys: HotkeyMap) => {
    try {
      Store.set('hotkeys', newHotkeys)
    } catch (error) {
      if (shouldLog()) {
        console.error('Error saving hotkeys:', error)
      }
    }
  })

  ipcMain.on('save-settings', (_event: IpcMainEvent, settings: Settings) => {
    try {
      const validatedSettings: Settings = {
        multiSoundEnabled: Boolean(settings.multiSoundEnabled),
        repeatSoundEnabled: Boolean(settings.repeatSoundEnabled),
        alwaysOnTop: Boolean(settings.alwaysOnTop),
        volume: Number(settings.volume),
        maxPoolSize:
          settings.maxPoolSize === undefined || Number.isNaN(Number(settings.maxPoolSize))
            ? 100
            : Number(settings.maxPoolSize),
        maxInstancesPerSound: Number(settings.maxInstancesPerSound) || 20,
        buttonSettings: Boolean(settings.buttonSettings),
        hiddenSounds: Array.isArray(settings.hiddenSounds) ? settings.hiddenSounds : [],
        buttonColors: typeof settings.buttonColors === 'object' ? settings.buttonColors || {} : {},
        dragAndDropEnabled: Boolean(settings.dragAndDropEnabled),
        favorites: {
          items: Array.isArray(settings.favorites?.items) ? settings.favorites.items : [],
          maxItems: Number(settings.favorites?.maxItems) || 18,
        },
        popoutGrid: {
          items: Array.isArray(settings.popoutGrid?.items) ? settings.popoutGrid.items : [],
          maxItems: Number(settings.popoutGrid?.maxItems) || 42,
          window: {
            isOpen: Boolean(settings.popoutGrid?.window?.isOpen),
            showOnStartup: Boolean(settings.popoutGrid?.window?.showOnStartup),
          },
        },
        theme:
          typeof settings.theme === 'object' &&
          typeof settings.theme?.buttonText === 'string' &&
          typeof settings.theme?.buttonActive === 'string' &&
          typeof settings.theme?.buttonColor === 'string' &&
          typeof settings.theme?.backgroundColor === 'string' &&
          typeof settings.theme?.buttonHoverColor === 'string'
            ? settings.theme
            : defaultSettings.theme,
        showSoundGrid: Boolean(settings.showSoundGrid),
        showMusicGrid: Boolean(settings.showMusicGrid),
      }

      if (
        Number.isNaN(validatedSettings.volume) ||
        validatedSettings.volume < 0 ||
        validatedSettings.volume > 1
      ) {
        validatedSettings.volume = 1
      }

      Store.set('settings', validatedSettings)

      if (win) {
        win.setAlwaysOnTop(validatedSettings.alwaysOnTop)
      }
      if (popoutWin) {
        popoutWin.setAlwaysOnTop(validatedSettings.alwaysOnTop)
      }

      win?.webContents.send('settings-updated', validatedSettings)
      popoutWin?.webContents.send('settings-updated', validatedSettings)
    } catch (error) {
      if (shouldLog()) {
        console.error('Error saving settings:', error)
      }
      try {
        Store.set('settings', defaultSettings)
      } catch (e) {
        if (shouldLog()) {
          console.error('Failed to save default settings:', e)
        }
      }
    }
  })

  ipcMain.on('toggle-always-on-top', (_event: IpcMainEvent, isEnabled: boolean) => {
    try {
      if (win) {
        win.setAlwaysOnTop(isEnabled)
        if (popoutWin) {
          popoutWin.setAlwaysOnTop(isEnabled)
        }
        const currentSettings = Store.get('settings') ?? defaultSettings
        const updatedSettings = {
          ...currentSettings,
          alwaysOnTop: isEnabled,
          maxPoolSize: Number(currentSettings.maxPoolSize) || 100,
          maxInstancesPerSound: Number(currentSettings.maxInstancesPerSound) || 20,
          buttonSettings: currentSettings.buttonSettings ?? false,
          hiddenSounds: Array.isArray(currentSettings.hiddenSounds)
            ? currentSettings.hiddenSounds
            : [],
          buttonColors:
            typeof currentSettings.buttonColors === 'object'
              ? currentSettings.buttonColors || {}
              : {},
          theme:
            typeof currentSettings.theme === 'object' &&
            typeof currentSettings.theme?.buttonText === 'string' &&
            typeof currentSettings.theme?.buttonActive === 'string' &&
            typeof currentSettings.theme?.buttonColor === 'string' &&
            typeof currentSettings.theme?.backgroundColor === 'string' &&
            typeof currentSettings.theme?.buttonHoverColor === 'string'
              ? currentSettings.theme
              : defaultSettings.theme,
          dragAndDropEnabled: Boolean(currentSettings.dragAndDropEnabled),
          favorites: {
            items: Array.isArray(currentSettings.favorites?.items)
              ? currentSettings.favorites.items
              : [],
            maxItems: Number(currentSettings.favorites?.maxItems) || 18,
          },
        }
        Store.set('settings', updatedSettings)
      }
    } catch (error) {
      if (shouldLog()) {
        console.error('Error toggling always-on-top:', error)
      }
    }
  })

  ipcMain.handle(
    'convert-audio',
    async (
      _,
      params: {
        buffer: ArrayBuffer
        originalName: string
        type: 'sound' | 'music'
      }
    ) => {
      try {
        const mode = process.platform === 'darwin' ? 0o755 : undefined
        const tempDir = path.normalize(path.join(app.getPath('userData'), 'temp'))
        const soundsDir = path.normalize(path.join(app.getPath('userData'), 'sounds'))

        await fs.mkdir(tempDir, { recursive: true, mode })
        await fs.mkdir(soundsDir, { recursive: true, mode })

        const safeOriginalName = path.basename(params.originalName).replace(/[^\w\s.-]/g, '_')
        const inputPath = path.normalize(path.join(tempDir, safeOriginalName))
        const outputName = `${path.basename(safeOriginalName, path.extname(safeOriginalName))}.opus`
        const outputPath = path.normalize(path.join(soundsDir, outputName))

        await fs.writeFile(inputPath, Buffer.from(params.buffer), { mode })
        await convertToOpus(inputPath, outputPath)

        try {
          await fs.unlink(inputPath)
        } catch (error) {
          if (shouldLog()) {
            console.error('Error cleaning up temp file:', error)
          }
        }

        return { outputPath: outputName }
      } catch (error) {
        if (shouldLog()) {
          console.error('Error converting audio:', error)
        }
        throw error
      }
    }
  )

  ipcMain.handle('add-sound', async (_, params: { sound: SoundData; type: 'sound' | 'music' }) => {
    try {
      await soundManagers[params.type].add(params.sound)
    } catch (error) {
      if (shouldLog()) {
        console.error('Error adding sound:', error)
      }
      throw error
    }
  })

  ipcMain.handle(
    'delete-sound',
    async (_, params: { sound: SoundData; type: 'sound' | 'music' }) => {
      try {
        await soundManagers[params.type].remove(params.sound.id)
      } catch (error) {
        if (shouldLog()) {
          console.error('Error deleting sound:', error)
        }
        throw error
      }
    }
  )

  ipcMain.handle('validate-sound', async (_, sound: SoundData) => {
    try {
      const soundPath = path.normalize(path.join(app.getPath('userData'), 'sounds', sound.file))
      await fs.access(soundPath)
      return true
    } catch (error) {
      if (shouldLog()) {
        console.error('Error validating sound:', error)
      }
      return false
    }
  })

  ipcMain.handle('get-app-data-path', async () => {
    return app.getPath('userData')
  })
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.commandLine.appendSwitch(
    'disable-features',
    'AutofillServerCommunication,AutofillUpstreamSendDetectedValues'
  )

  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
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
      createPopoutWindow()
      setupIPC()
    } catch (error) {
      if (shouldLog()) {
        console.error('Error during startup:', error)
      }
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

function cleanupWindows(): void {
  popoutWin?.destroy()
  win?.destroy()
}

function cleanupIPC(): void {
  ipcMain.removeAllListeners()
  win?.webContents?.session.protocol.unhandle('app')
}

app.once('before-quit', async () => {
  setIsQuitting(true)

  try {
    const settings = Store.get('settings')
    if (settings) {
      Store.set('settings', settings)
    }
  } catch (error) {
    console.error('Error during shutdown:', error)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  cleanupWindows()
  cleanupIPC()
})

process.on('uncaughtException', (error: Error) => {
  console.error('[Critical] Uncaught Exception:', error)
})

process.on('unhandledRejection', (error: Error | unknown) => {
  console.error('[Critical] Unhandled Rejection:', error)
})
