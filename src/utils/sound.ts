import type { SoundData } from "@/types"
import AudioPool from "@/utils/audio-pool"
import HotkeyManager from "@/utils/hotkeys"
import { generateSoundId } from "@/utils/sound-id"
import { soundData } from "@/data/audio"
import { musicData } from "@/data/music"

interface SoundAppConfig {
  multiSoundEnabled: boolean
  repeatSoundEnabled: boolean
  volume: number
}

class SoundboardApp {
  private container1: HTMLElement
  private container2: HTMLElement
  private audioPool: AudioPool
  private hotkeyManager: HotkeyManager
  private stopAllButton: HTMLButtonElement
  private template: HTMLTemplateElement
  private volumeSlider: HTMLInputElement
  private config: SoundAppConfig

  constructor(initialConfig: SoundAppConfig) {
    this.container1 = document.getElementById("container1") as HTMLElement
    this.container2 = document.getElementById("container2") as HTMLElement
    this.stopAllButton = document.getElementById(
      "stopAllButton"
    ) as HTMLButtonElement
    this.template = document.getElementById(
      "sound-button-template"
    ) as HTMLTemplateElement
    this.volumeSlider = document.getElementById(
      "volumeSlider"
    ) as HTMLInputElement

    this.config = initialConfig
    this.audioPool = new AudioPool(
      100,
      10,
      initialConfig.multiSoundEnabled,
      initialConfig.repeatSoundEnabled
    )
    this.hotkeyManager = new HotkeyManager()

    this.initializeSoundboard()
    this.setupEventListeners()
  }

  updateConfig(newConfig: Partial<SoundAppConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if ("volume" in newConfig && typeof newConfig.volume === "number") {
      this.volumeSlider.value = newConfig.volume.toString()
      this.audioPool.updateVolume(newConfig.volume)
    }

    if ("multiSoundEnabled" in newConfig) {
      this.audioPool.updateMultiSoundEnabled(!!newConfig.multiSoundEnabled)
    }

    if ("repeatSoundEnabled" in newConfig) {
      this.audioPool.updateRepeatSoundEnabled(!!newConfig.repeatSoundEnabled)
    }
  }

  private async toggleSound(
    file: string,
    buttonId: string,
    isUserAdded: boolean = false
  ): Promise<void> {
    const buttonElement = document.getElementById(buttonId) as HTMLButtonElement
    const currentVolume = parseFloat(this.volumeSlider.value)

    try {
      const isPlaying = this.audioPool.isPlaying(file)

      if (this.config.repeatSoundEnabled) {
        await this.playSound(
          file,
          currentVolume,
          buttonElement,
          true,
          isUserAdded
        )
        return
      }

      if (isPlaying) {
        this.audioPool.stopSpecific(file)
        buttonElement.classList.remove("active")
        return
      }

      if (!this.config.multiSoundEnabled) {
        await this.stopActiveSounds()
      }

      await this.playSound(
        file,
        currentVolume,
        buttonElement,
        false,
        isUserAdded
      )
    } catch (error) {
      buttonElement.classList.remove("active")
      this.audioPool.stopSpecific(file)
    }
  }

  private async playSound(
    file: string,
    volume: number,
    buttonElement: HTMLButtonElement,
    repeat: boolean,
    isUserAdded: boolean = false
  ): Promise<void> {
    try {
      await this.audioPool.play(file, isUserAdded, volume, repeat, () => {
        buttonElement.classList.remove("active")
      })
      buttonElement.classList.add("active")
    } catch (error) {
      throw error
    }
  }

  private async stopActiveSounds(): Promise<void> {
    const soundButtons = Array.from(
      document.querySelectorAll(".sound-button.active")
    )
    const uiButtons = Array.from(
      document.querySelectorAll(".settings-control.active")
    )
    const activeButtons = soundButtons.filter((btn) => !uiButtons.includes(btn))

    if (activeButtons.length > 0) {
      for (const btn of activeButtons) {
        const soundId = btn.id
        const soundFile = this.getSoundFileFromId(soundId)
        if (soundFile && this.audioPool.isPlaying(soundFile)) {
          this.audioPool.stopSpecific(soundFile)
          btn.classList.remove("active")
        }
      }
    }
  }

  private getSoundFileFromId(id: string): string | undefined {
    const foundSound = soundData.find(
      (s) => s.id === id || generateSoundId(s.file) === id
    )
    if (foundSound) {
      return foundSound.file
    }

    const foundMusic = musicData.find(
      (s) => s.id === id || generateSoundId(s.file) === id
    )
    return foundMusic?.file
  }

  private createSoundButton(data: SoundData): HTMLElement {
    const button = this.template.content.cloneNode(true) as HTMLElement
    const btnElement = button.querySelector("button") as HTMLButtonElement

    const soundId = data.id ?? generateSoundId(data.file)
    btnElement.id = soundId
    btnElement.setAttribute("data-sound-id", soundId)
    btnElement.onclick = () =>
      this.toggleSound(data.file, soundId, data.isUserAdded)
    btnElement.oncontextmenu = (e) => {
      e.preventDefault()
      this.hotkeyManager.showModal(soundId)
      return false
    }

    const titleSpan = button.querySelector(".title") as HTMLSpanElement
    titleSpan.textContent = data.title

    return button
  }

  private initializeSoundboard(): void {
    if (!this.container1 || !this.container2) {
      return
    }

    this.container1.innerHTML = ""
    this.container2.innerHTML = ""

    soundData.forEach((data) => {
      this.container1.appendChild(this.createSoundButton(data))
    })

    musicData.forEach((data) => {
      this.container2.appendChild(this.createSoundButton(data))
    })
  }

  private setupEventListeners(): void {
    this.stopAllButton.addEventListener("click", () => {
      const soundButtons = document.querySelectorAll(
        ".sound-button:not(.settings-control).active"
      )
      soundButtons.forEach((button) => {
        const soundId = button.id
        const soundFile = this.getSoundFileFromId(soundId)
        if (soundFile) {
          this.audioPool.stopSpecific(soundFile)
          button.classList.remove("active")
        }
      })
    })

    this.volumeSlider.addEventListener("input", () => {
      const volume = parseFloat(this.volumeSlider.value)
      this.audioPool.updateVolume(volume)
    })
  }
}

export type { SoundAppConfig }
export default SoundboardApp
