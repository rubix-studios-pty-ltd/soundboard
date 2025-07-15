import type { BrowserWindow as BrowserWindowType } from "electron"
import { BrowserWindow } from "electron"
import path from "path"
import { getIsQuitting } from "@/store/quitting"
import Store from "@/store/settings"

const ROOT_PATH = path.join(__dirname, "..")
export let popoutWin: BrowserWindowType | null = null

export async function createPopoutWindow(): Promise<void> {
  const settings = Store.get("settings")
  popoutWin = new BrowserWindow({
    width: 312,
    height: 498,
    resizable: true,
    alwaysOnTop: settings?.alwaysOnTop ?? false,
    frame: false,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: -999999, y: -999999 },
    show: false,
    type: "toolbar",
    skipTaskbar: true,
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

  if (popoutWin) {
    popoutWin.once("ready-to-show", () => {
      if (
        settings?.popoutGrid?.window?.isOpen ||
        settings?.popoutGrid?.window?.showOnStartup
      ) {
        popoutWin?.setAlwaysOnTop(settings?.alwaysOnTop ?? false)
        popoutWin?.show()
      }
    })

    popoutWin.loadFile(path.join(ROOT_PATH, "popout.html"))

    popoutWin.on("close", (e) => {
      if (!getIsQuitting()) {
        e.preventDefault()
        popoutWin?.hide()
      }
    })
  }
}

export function destroyPopoutWindow(): void {
  popoutWin?.destroy()
  popoutWin = null
}
