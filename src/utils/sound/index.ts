import HotkeyManager from '@/lib/system/hotkeys'
import type { Config } from '@/types/config'
import type { SoundData } from '@/types/sound'
import AudioPool from '@/utils/audio/pool'
import { getElement } from '@/utils/getElement'
import { generateId } from '@/utils/sound/generateId'
import { getMusic } from '@/utils/sound/getMusic'
import { getSound } from '@/utils/sound/getSound'

export class SoundboardApp {
  private container1: HTMLElement
  private container2: HTMLElement
  private audioPool: AudioPool
  private hotkeyManager: HotkeyManager
  private stopAllButton: HTMLButtonElement
  private template: HTMLTemplateElement
  private volumeSlider: HTMLInputElement
  private config: Config

  constructor(initialConfig: Config) {
    this.container1 = getElement('container1')
    this.container2 = getElement('container2')
    this.stopAllButton = getElement('stopAllButton')
    this.template = getElement('sound-button-template')
    this.volumeSlider = getElement('volumeSlider')

    this.config = initialConfig
    this.audioPool = new AudioPool(100, 10, initialConfig.enableMulti, initialConfig.enableRepeat)
    this.hotkeyManager = new HotkeyManager()

    this.initializeSoundboard()
    this.setupEventListeners()
  }

  updateConfig(newConfig: Partial<Config>): void {
    this.config = { ...this.config, ...newConfig }

    if ('volume' in newConfig && typeof newConfig.volume === 'number') {
      this.volumeSlider.value = newConfig.volume.toString()
      this.audioPool.updateVolume(newConfig.volume)
    }

    if ('enableMulti' in newConfig) {
      this.audioPool.updateMulti(!!newConfig.enableMulti)
    }

    if ('enableRepeat' in newConfig) {
      this.audioPool.updateRepeat(!!newConfig.enableRepeat)
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

      if (this.config.enableRepeat) {
        await this.playSound(file, currentVolume, buttonElement, true, isUserAdded)
        return
      }

      if (isPlaying) {
        this.audioPool.stopSpecific(file)
        buttonElement.classList.remove('active')
        return
      }

      if (!this.config.enableMulti) {
        await this.stopActiveSounds()
      }

      await this.playSound(file, currentVolume, buttonElement, false, isUserAdded)
    } catch {
      buttonElement.classList.remove('active')
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
    await this.audioPool.play(file, isUserAdded, volume, repeat, () => {
      buttonElement.classList.remove('active')
    })
    buttonElement.classList.add('active')
  }

  private async stopActiveSounds(): Promise<void> {
    const soundButtons = Array.from(document.querySelectorAll('.sound-button.active'))
    const uiButtons = Array.from(document.querySelectorAll('.settings-control.active'))
    const activeButtons = soundButtons.filter((btn) => !uiButtons.includes(btn))

    if (activeButtons.length > 0) {
      for (const btn of activeButtons) {
        const soundId = btn.id
        const soundFile = this.getSoundFileFromId(soundId)
        if (soundFile && this.audioPool.isPlaying(soundFile)) {
          this.audioPool.stopSpecific(soundFile)
          btn.classList.remove('active')
        }
      }
    }
  }

  private getSoundFileFromId(id: string): string | undefined {
    const foundSound = getSound().find((s) => s.id === id || generateId(s.file) === id)
    if (foundSound) {
      return foundSound.file
    }

    const foundMusic = getMusic().find((s) => s.id === id || generateId(s.file) === id)
    return foundMusic?.file
  }

  private createSoundButton(data: SoundData): HTMLElement {
    const button = this.template.content.cloneNode(true) as HTMLElement
    const btnElement = button.querySelector('button') as HTMLButtonElement

    const soundId = data.id ?? generateId(data.file)
    btnElement.id = soundId
    btnElement.setAttribute('data-sound-id', soundId)
    btnElement.onclick = () => this.toggleSound(data.file, soundId, data.isUserAdded)
    btnElement.oncontextmenu = (e) => {
      e.preventDefault()
      this.hotkeyManager.showModal(soundId)
      return false
    }

    const titleSpan = button.querySelector('.title') as HTMLSpanElement
    titleSpan.textContent = data.title

    return button
  }

  private initializeSoundboard(): void {
    if (!this.container1 || !this.container2) {
      return
    }

    this.container1.innerHTML = ''
    this.container2.innerHTML = ''

    getSound().forEach((data) => {
      this.container1.appendChild(this.createSoundButton(data))
    })

    getMusic().forEach((data) => {
      this.container2.appendChild(this.createSoundButton(data))
    })
  }

  private setupEventListeners(): void {
    this.stopAllButton.addEventListener('click', () => {
      const soundButtons = document.querySelectorAll('.sound-button:not(.settings-control).active')
      soundButtons.forEach((button) => {
        const soundId = button.id
        const soundFile = this.getSoundFileFromId(soundId)
        if (soundFile) {
          this.audioPool.stopSpecific(soundFile)
          button.classList.remove('active')
        }
      })
    })

    this.volumeSlider.addEventListener('input', () => {
      const volume = parseFloat(this.volumeSlider.value)
      this.audioPool.updateVolume(volume)
    })
  }
}
