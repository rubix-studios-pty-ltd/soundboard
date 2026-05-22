import { maxInstance, maxPool } from '@/constants/settings'
import { type Pool } from '@/types/pool'
import {
  clearPool,
  type PoolState,
  pruneOldest,
  pruneSource,
  releaseAudio,
  removeAudio,
  stoppedAudio,
} from '@/utils/system/pool/cleanup'
import { createElement, getElement, warmPool } from '@/utils/system/pool/lifecycle'
import { audioListeners } from '@/utils/system/pool/listeners'
import { singleItem, singlePool } from '@/utils/system/pool/modes'

export class AudioPool {
  private pool: Map<string, Pool>
  private maxPool: number
  private maxInstances: number
  private enableMulti: boolean
  private enableRepeat: boolean
  private unusedAudio: HTMLAudioElement[]
  private instanceCounts: Map<string, number>
  private audioContext: AudioContext
  private loadingSounds: Set<string>
  private audioWarmup: Promise<void> | null
  private initialized: boolean

  constructor(enableMulti: boolean = true, enableRepeat: boolean = false) {
    this.pool = new Map()
    this.maxPool = maxPool
    this.maxInstances = maxInstance
    this.unusedAudio = []
    this.instanceCounts = new Map()
    this.enableMulti = enableMulti
    this.enableRepeat = enableRepeat
    this.audioContext = new AudioContext()
    this.loadingSounds = new Set()
    this.audioWarmup = this.warmAudio()
    this.initialized = false
  }

  private async warmAudio(): Promise<void> {
    if (this.initialized) return

    await warmPool(this.initialized, this.maxPool, this.unusedAudio)

    this.initialized = true
  }

  private getAudio(): HTMLAudioElement {
    return getElement(this.unusedAudio, createElement)
  }

  private audioListeners(poolItem: Pool): void {
    audioListeners(this.poolState(), poolItem)
  }

  private cleanupAudio(item: Pool): void {
    releaseAudio(this.poolState(), item)
  }

  private poolState(): PoolState {
    return {
      pool: this.pool,
      instanceCounts: this.instanceCounts,
      maxPool: this.maxPool,
      maxInstances: this.maxInstances,
      unusedAudio: this.unusedAudio,
    }
  }

  private async playFromUrl(
    url: string,
    source: string,
    isUserAdded: boolean,
    volume: number,
    repeat: boolean = false,
    onEnd?: () => void
  ): Promise<void> {
    const instanceId = `${source}_${Date.now()}`

    let finalUrl = url
    if (isUserAdded) {
      try {
        finalUrl = await window.electronAPI.userSoundPath(url)
      } catch (error) {
        console.error('Error resolving user sound path:', error)
      }
    }

    if (repeat) {
      const currentCount = this.instanceCounts.get(source) || 0
      if (currentCount >= this.maxInstances) {
        pruneSource(this.poolState(), source)
      }
    }

    if (this.pool.size >= this.maxPool) {
      if (!pruneOldest(this.poolState())) {
        const stoppedItem = stoppedAudio(this.pool)

        if (stoppedItem) {
          const stoppedKey = Array.from(this.pool.entries()).find(
            ([_, item]) => item === stoppedItem
          )?.[0]
          if (stoppedKey) {
            removeAudio(this.poolState(), stoppedKey)
          }
        } else {
          console.warn('Audio pool is full.')
          return
        }
      }
    }

    try {
      const audioElement = this.getAudio()

      const poolItem: Pool = {
        audio: audioElement,
        source,
        isPlaying: false,
        cleanupListeners: [],
        onEnd,
        lastUsed: Date.now(),
      }

      this.audioListeners(poolItem)
      this.pool.set(instanceId, poolItem)

      audioElement.currentTime = 0
      audioElement.src = finalUrl
      audioElement.volume = volume
      audioElement.loop = false
      audioElement.onloadedmetadata = () => {
        poolItem.duration = audioElement.duration
      }
      await audioElement.play()
      poolItem.isPlaying = true
      poolItem.lastUsed = Date.now()

      const currentCount = this.instanceCounts.get(source) || 0
      this.instanceCounts.set(source, currentCount + 1)
    } catch (error) {
      console.error('Error playing audio:', error)
      const item = this.pool.get(instanceId)
      if (item) {
        this.cleanupAudio(item)
        this.pool.delete(instanceId)
      }
      throw error
    }
  }

  async playAudio(
    source: string,
    isUserAdded: boolean,
    volume: number,
    repeat: boolean = false,
    onEnd?: () => void
  ): Promise<void> {
    if (this.audioWarmup || !this.initialized) await this.audioWarmup
    if (this.loadingSounds.has(source)) return

    if (!this.enableMulti) {
      if (this.enableRepeat) {
        for (const [key, item] of this.pool.entries()) {
          if (item.source !== source) {
            this.cleanupAudio(item)
            this.pool.delete(key)
          }
        }
      } else {
        this.stopAll()
      }
    } else if (!this.enableRepeat) {
      this.stopSpecific(source)
    }

    try {
      this.loadingSounds.add(source)
      await this.playFromUrl(
        source,
        source,
        isUserAdded,
        volume,
        this.enableRepeat && repeat,
        onEnd
      )
    } finally {
      this.loadingSounds.delete(source)
    }
  }

  stopAll(): void {
    clearPool(this.poolState())
  }

  stopSpecific(source: string): void {
    let itemsFound = false
    for (const [key, item] of this.pool.entries()) {
      if (item.source === source) {
        removeAudio(this.poolState(), key)
        itemsFound = true
      }
    }
    if (itemsFound) {
      this.instanceCounts.set(source, 0)
    }
  }

  updateVolume(volume: number): void {
    this.pool.forEach(({ audio }) => {
      audio.volume = volume
    })
  }

  updateMulti(enabled: boolean): void {
    this.enableMulti = enabled
    if (!enabled) {
      singlePool(this.poolState())
    }
  }

  updateRepeat(enabled: boolean): void {
    this.enableRepeat = enabled
    if (!enabled) {
      singleItem(this.poolState())
    }
  }

  isPlaying(source: string): boolean {
    for (const [, item] of this.pool.entries()) {
      if (item.source === source && item.isPlaying) {
        return true
      }
    }
    return false
  }

  dispose(): void {
    this.stopAll()

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch((err) => {
        console.warn('Failed to close AudioContext:', err)
      })
    }

    this.pool.clear()
    this.instanceCounts.clear()
    this.unusedAudio.forEach((audio) => {
      audio.src = ''
      audio.load()
    })
    this.unusedAudio = []
    this.initialized = false
    this.audioWarmup = null
  }
}
