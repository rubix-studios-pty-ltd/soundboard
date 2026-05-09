import getEl from '@/lib/getelement'
import type { HotkeyMap } from '@/types'

class HotkeyManager {
  private modal: HTMLElement
  private assignedKeyLabel: HTMLElement
  private clearHotkeyButton: HTMLElement
  private closeModalButton: HTMLElement
  private currentSoundId: string | null
  private hotkeyMap: HotkeyMap

  constructor() {
    this.modal = getEl('hotkeyModal')
    this.assignedKeyLabel = getEl('assignedKeyLabel')
    this.clearHotkeyButton = getEl('clearHotkeyButton')
    this.closeModalButton = getEl('closeModalButton')
    this.currentSoundId = null
    this.hotkeyMap = {}
    this.setupEventListeners()
  }

  public async init(): Promise<void> {
    await this.initializeHotkeys()
  }

  private async initializeHotkeys(): Promise<void> {
    try {
      this.hotkeyMap = await window.electronAPI.loadHotkeys()
    } catch (error) {
      console.error('Error loading hotkeys:', error)
      this.hotkeyMap = {}
    }
  }

  private setupEventListeners(): void {
    this.closeModalButton.addEventListener('click', () => this.hideModal())

    this.clearHotkeyButton.addEventListener('click', () => {
      if (this.currentSoundId && this.currentSoundId in this.hotkeyMap) {
        delete this.hotkeyMap[this.currentSoundId]
        window.electronAPI.saveHotkeys(this.hotkeyMap)
        this.hideModal()
      }
    })

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (this.modal.style.display === 'flex' && this.currentSoundId) {
        event.preventDefault()

        for (const id in this.hotkeyMap) {
          if (this.hotkeyMap[id] === key) {
            delete this.hotkeyMap[id]
            break
          }
        }

        this.hotkeyMap[this.currentSoundId] = key
        window.electronAPI.saveHotkeys(this.hotkeyMap)
        this.hideModal()
        return
      }

      if (this.modal.style.display !== 'flex') {
        const soundId = Object.entries(this.hotkeyMap).find(([, hotkey]) => hotkey === key)?.[0]
        if (soundId) {
          const btn =
            (document.querySelector(`[data-sound-id="${soundId}"]`) as HTMLButtonElement) ??
            (document.getElementById(soundId) as HTMLButtonElement)

          btn?.click()
        }
      }
    })
  }

  showModal(soundId: string): void {
    this.currentSoundId = soundId
    const currentHotkey = this.hotkeyMap[soundId]
    this.assignedKeyLabel.innerHTML = currentHotkey
      ? `Hiện tại: "${currentHotkey}". <br>Nhấn phím mới để thay đổi.`
      : 'Nhấn bất kỳ phím nào để gán.'
    this.modal.style.display = 'flex'
  }

  private hideModal(): void {
    this.modal.style.display = 'none'
    this.currentSoundId = null
  }
}

export default HotkeyManager
