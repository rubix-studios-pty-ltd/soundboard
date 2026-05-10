import { promises as fs } from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow, protocol } from 'electron'

import { getIsQuitting } from '@/store/quitting'
import { Electron } from '@/store/settings'
import { getMime } from '@/utils/getMime'

const ROOT_PATH = path.join(__dirname, '..')

export let win: BrowserWindow | null = null
let popoutWin: BrowserWindow | null = null

export async function createWindow(): Promise<void> {
  const settings = Electron.get('settings')

  win = new BrowserWindow({
    width: 620,
    height: 984,
    resizable: true,
    alwaysOnTop: settings?.alwaysOnTop ?? false,
    frame: false,
    show: false,
    titleBarStyle: 'hidden',
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

  if (win) {
    win.once('ready-to-show', () => {
      win?.show()
    })

    protocol.handle('app', async (request: Request) => {
      const url = new URL(request.url)
      const filePath = decodeURIComponent(url.pathname)
      const extension = path.extname(filePath).toLowerCase()
      const skipCompression = ['.opus', '.mp3', '.ogg'].includes(extension)

      const soundPath = [
        path.join(app.getPath('userData'), 'sounds', filePath),
        path.join(ROOT_PATH, filePath),
      ]

      for (const candidate of soundPath) {
        try {
          await fs.access(candidate)
          const data = await fs.readFile(candidate)
          const contentType = getMime(extension)

          return new Response(data, {
            headers: {
              'Content-Type': contentType,
              'Content-Encoding': skipCompression ? 'identity' : 'br',
            },
          })
        } catch {}
      }

      return new Response('File not found', { status: 404 })
    })

    win.loadFile(path.join(ROOT_PATH, 'index.html'))

    win.on('close', () => {
      if (getIsQuitting() && popoutWin) {
        popoutWin.destroy()
        popoutWin = null
      }
    })
  }
}

export function destroyMainWindow(): void {
  win?.destroy()
  win = null
}
