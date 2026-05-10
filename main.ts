import { promises as fs } from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow, type IpcMainEvent, ipcMain } from 'electron'

import { defaultSettings } from '@/constants/settings'
import { setIsQuitting } from '@/store/quitting'
import { Electron } from '@/store/settings'
import { type HotkeyMap } from '@/types/hotkeys'
import { type Settings } from '@/types/settings'
import { type SoundData } from '@/types/sound'
import { audioManager } from '@/utils/audio/audioManager'
import { convertOpus } from '@/utils/audio/convertOpus'
import { createWindow, win } from '@/window/main'
import { createPopoutWindow, popoutWin } from '@/window/popup'

const shouldLog = () => process.argv.includes('--enable-logging')

const manager = {
  sound: audioManager('sound'),
  music: audioManager('music'),
}

const maxPool = 100
const maxInstance = 10
const maxFavorites = 18
const maxPopout = 42

function sanitizeSettings(raw: unknown): Settings {
  const s = (typeof raw === 'object' && raw) ? (raw as Partial<Settings>) : {}

  const themeOk =
    typeof s.theme === 'object' &&
    typeof s.theme?.buttonText === 'string' &&
    typeof s.theme?.buttonActive === 'string' &&
    typeof s.theme?.buttonColor === 'string' &&
    typeof s.theme?.backgroundColor === 'string' &&
    typeof s.theme?.buttonHoverColor === 'string'

  return {
    enableMulti: Boolean(s.enableMulti),
    enableRepeat: Boolean(s.enableRepeat),
    alwaysOnTop: Boolean(s.alwaysOnTop),
    volume: Number.isFinite(Number((s as any).volume)) ? Number((s as any).volume) : defaultSettings.volume,
    maxPoolSize: maxPool,
    maxInstancesPerSound: maxInstance,
    buttonSettings: Boolean(s.buttonSettings),
    hiddenSounds: Array.isArray(s.hiddenSounds) ? s.hiddenSounds as string[] : [],
    buttonColors: typeof s.buttonColors === 'object' && s.buttonColors ? s.buttonColors || {} : {},
    dragAndDropEnabled: Boolean(s.dragAndDropEnabled),
    favorites: {
      items: Array.isArray(s.favorites?.items) ? s.favorites!.items : [],
      maxItems: maxFavorites,
    },
    theme: themeOk ? (s.theme as Settings['theme']) : defaultSettings.theme,
    popoutGrid: {
      items: Array.isArray(s.popoutGrid?.items) ? s.popoutGrid!.items : [],
      maxItems: maxPopout,
      window: {
        isOpen: Boolean(s.popoutGrid?.window?.isOpen),
        showOnStartup: Boolean(s.popoutGrid?.window?.showOnStartup),
      },
    },
    showSoundGrid: Boolean(s.showSoundGrid),
    showMusicGrid: Boolean(s.showMusicGrid),
  }
}

try {
  const raw = Electron.get('settings')
  Electron.set('settings', sanitizeSettings(raw))
} catch {
  Electron.set('settings', defaultSettings)
}

function setupIPC(): void {
  ipcMain.handle('load-sounds', async (_, type: 'sound' | 'music') => {
    return await manager[type].getAll()
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
            const settings = Electron.get('settings')
            Electron.set('settings', {
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
            const settings = Electron.get('settings')
            targetWindow.setAlwaysOnTop(settings?.alwaysOnTop ?? false)
            targetWindow.show()
            Electron.set('settings', {
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
      return Electron.get('hotkeys') ?? {}
    } catch (error) {
      if (shouldLog()) {
        console.error('Error loading hotkeys:', error)
      }
      return {}
    }
  })

  ipcMain.handle('load-settings', (): Settings => {
    try {
      return Electron.get('settings') ?? defaultSettings
    } catch (error) {
      if (shouldLog()) {
        console.error('Error loading settings:', error)
      }
      return defaultSettings
    }
  })

  ipcMain.on('save-hotkeys', (_event: IpcMainEvent, newHotkeys: HotkeyMap) => {
    try {
      Electron.set('hotkeys', newHotkeys)
    } catch (error) {
      if (shouldLog()) {
        console.error('Error saving hotkeys:', error)
      }
    }
  })

  ipcMain.on('save-settings', (_event: IpcMainEvent, settings: Settings) => {
    try {

      const validatedSettings = sanitizeSettings(settings)
      Electron.set('settings', validatedSettings)

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
        Electron.set('settings', defaultSettings)
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
        const currentSettings = Electron.get('settings') ?? defaultSettings
        const updatedSettings = sanitizeSettings({ ...currentSettings, alwaysOnTop: isEnabled })
        Electron.set('settings', updatedSettings)
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
        await convertOpus(inputPath, outputPath)

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
      await manager[params.type].add(params.sound)
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
        await manager[params.type].remove(params.sound.id)
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
    const settings = Electron.get('settings')
    if (settings) {
      Electron.set('settings', settings)
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
