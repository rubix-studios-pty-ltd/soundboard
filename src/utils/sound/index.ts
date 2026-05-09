import { KeyManager } from '@/lib/system/hotkeys'
import type { Config } from '@/types/config'
import type { SoundData } from '@/types/sound'
import { AudioPool } from '@/utils/audio/audioPool'
import { getElement } from '@/utils/getElement'
import { generateId } from '@/utils/sound/generateId'
import { getMusic } from '@/utils/sound/getMusic'
import { getSound } from '@/utils/sound/getSound'

export class SoundboardApp {
  private container1: HTMLElement
  private container2: HTMLElement
  private audioPool: AudioPool
  private keyManager: KeyManager
  private stop: HTMLButtonElement
  private template: HTMLTemplateElement
  private volume: HTMLInputElement
  private config: Config

  constructor(config: Config) {
    this.container1 = getElement('container1')
    this.container2 = getElement('container2')
    this.stop = getElement('stop')
    this.template = getElement('template')
    this.volume = getElement('volume')

    this.config = config
    this.audioPool = new AudioPool(100, 10, config.enableMulti, config.enableRepeat)
    this.keyManager = new KeyManager()

    this.initializeSoundboard()
    this.setupEventListeners()
  }

  updateConfig(newConfig: Partial<Config>): void {
    this.config = { ...this.config, ...newConfig }

    if ('volume' in newConfig && typeof newConfig.volume === 'number') {
      this.volume.value = newConfig.volume.toString()
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
    const currentVolume = parseFloat(this.volume.value)

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
      this.keyManager.showModal(soundId)
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
    this.stop.addEventListener('click', () => {
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

    this.volume.addEventListener('input', () => {
      const volume = parseFloat(this.volume.value)
      this.audioPool.updateVolume(volume)
    })
  }
}
