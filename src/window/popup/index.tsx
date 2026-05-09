import path from 'node:path'
import { BrowserWindow } from 'electron'

import { getIsQuitting } from '@/store/quitting'
import Store from '@/store/settings'

const ROOT_PATH = path.join(__dirname, '..')

export let popoutWin: BrowserWindow | null = null

export async function createPopoutWindow(): Promise<void> {
  const settings = Store.get('settings')

  const popup = settings?.popoutGrid?.window

  const window = new BrowserWindow({
    width: 312,
    height: 498,
    resizable: true,
    alwaysOnTop: settings?.alwaysOnTop ?? false,
    frame: false,
    show: false,
    skipTaskbar: true,
    icon: path.join(ROOT_PATH, 'icon.ico'),
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hidden',
          trafficLightPosition: { x: -100, y: -100 },
        }
      : {}),
    webPreferences: {
      partition: 'persist:soundboard',
      preload: path.join(ROOT_PATH, 'dist', 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false,
    },
  })

  popoutWin = window

  window.once('ready-to-show', () => {
    if (popup?.isOpen || popup?.showOnStartup) {
      window.setAlwaysOnTop(settings?.alwaysOnTop ?? false)
      window.show()
    }
  })

  void window.loadFile(path.join(ROOT_PATH, 'popout.html'))

  window.on('close', (event) => {
    if (!getIsQuitting()) {
      event.preventDefault()

      window.hide()
    }
  })
}

export function destroyPopoutWindow(): void {
  popoutWin?.destroy()
  popoutWin = null
}
