import type { HotkeyMap } from "@/types"

class HotkeyManager {
  private modal: HTMLElement
  private assignedKeyLabel: HTMLElement
  private clearHotkeyButton: HTMLElement
  private closeModalButton: HTMLElement
  private currentSoundId: string | null
  private hotkeyMap: HotkeyMap

  constructor() {
    this.modal = document.getElementById("hotkeyModal") as HTMLElement
    this.assignedKeyLabel = document.getElementById(
      "assignedKeyLabel"
    ) as HTMLElement
    this.clearHotkeyButton = document.getElementById(
      "clearHotkeyButton"
    ) as HTMLElement
    this.closeModalButton = document.getElementById(
      "closeModalButton"
    ) as HTMLElement
    this.currentSoundId = null
    this.hotkeyMap = {}

    this.initializeHotkeys()
    this.setupEventListeners()
  }

  private async initializeHotkeys(): Promise<void> {
    try {
      this.hotkeyMap = await window.electronAPI.loadHotkeys()
    } catch (error) {
      console.error("Error loading hotkeys:", error)
      this.hotkeyMap = {}
    }
  }

  private setupEventListeners(): void {
    this.closeModalButton.addEventListener("click", () => {
      this.hideModal()
    })

    this.clearHotkeyButton.addEventListener("click", () => {
      if (this.currentSoundId && this.currentSoundId in this.hotkeyMap) {
        delete this.hotkeyMap[this.currentSoundId]
        window.electronAPI.saveHotkeys(this.hotkeyMap)
        this.hideModal()
      }
    })

    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (this.modal.style.display === "flex" && this.currentSoundId) {
        event.preventDefault()
        const key = event.key.toLowerCase()

        const existingSound = Object.entries(this.hotkeyMap).find(
          ([, hotkey]) => hotkey === key
        )
        if (existingSound) {
          delete this.hotkeyMap[existingSound[0]]
        }

        this.hotkeyMap[this.currentSoundId] = key
        window.electronAPI.saveHotkeys(this.hotkeyMap)
        this.hideModal()
      }
    })

    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (this.modal.style.display !== "flex") {
        const key = event.key.toLowerCase()
        const soundId = Object.entries(this.hotkeyMap).find(
          ([, hotkey]) => hotkey === key
        )?.[0]
        if (soundId) {
          const button = document.querySelector(
            `[data-sound-id="${soundId}"]`
          ) as HTMLButtonElement
          if (button) {
            button.click()
          } else {
            const buttonById = document.getElementById(
              soundId
            ) as HTMLButtonElement
            buttonById?.click()
          }
        }
      }
    })
  }

  showModal(soundId: string): void {
    this.currentSoundId = soundId
    const currentHotkey = this.hotkeyMap[soundId]
    this.assignedKeyLabel.innerHTML = currentHotkey
      ? `Hiện tại: "${currentHotkey}". <br>Nhấn phím mới để thay đổi.`
      : "Nhấn bất kỳ phím nào để gán."
    this.modal.style.display = "flex"
  }

  private hideModal(): void {
    this.modal.style.display = "none"
    this.currentSoundId = null
  }
}

export default HotkeyManager
