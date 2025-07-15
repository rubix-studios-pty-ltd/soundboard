import type { BrowserWindow as BrowserWindowType } from "electron"
import { app, BrowserWindow, protocol } from "electron"
import { promises as fs } from "fs"
import path from "path"
import { getIsQuitting } from "@/store/quitting"
import Store from "@/store/settings"

import { getMimeType } from "@/lib/getmime"

const ROOT_PATH = path.join(__dirname, "..")
export let win: BrowserWindowType | null = null
let popoutWin: BrowserWindowType | null = null

export async function createWindow(): Promise<void> {
  const settings = Store.get("settings")
  win = new BrowserWindow({
    width: 614,
    height: 984,
    resizable: true,
    alwaysOnTop: settings?.alwaysOnTop ?? false,
    frame: false,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: -999999, y: -999999 },
    show: false,
    icon: path.join(__dirname, "..", "icon.ico"),
    webPreferences: {
      partition: "persist:soundboard",
      preload: path.join(ROOT_PATH, "dist", "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  })

  if (win) {
    win.once("ready-to-show", () => {
      win?.show()
    })

    protocol.handle("app", async (request: Request) => {
      const url = new URL(request.url)
      const filePath = decodeURIComponent(url.pathname)
      const extension = path.extname(filePath).toLowerCase()
      const skipCompression = [".opus", ".mp3", ".ogg"].includes(extension)

      const soundPath = [
        path.join(app.getPath("userData"), "sounds", filePath),
        path.join(ROOT_PATH, filePath),
      ]

      for (const candidate of soundPath) {
        try {
          await fs.access(candidate)
          const data = await fs.readFile(candidate)
          const contentType = getMimeType(extension)

          return new Response(data, {
            headers: {
              "Content-Type": contentType,
              "Content-Encoding": skipCompression ? "identity" : "br",
            },
          })
        } catch {
          continue
        }
      }

      return new Response("File not found", { status: 404 })
    })

    win.loadFile(path.join(ROOT_PATH, "index.html"))

    win.on("close", () => {
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
