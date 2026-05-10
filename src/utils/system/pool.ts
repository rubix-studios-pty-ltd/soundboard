import { maxInstance, maxPool } from '@/constants/settings'
import { type Pool } from '@/types/pool'

const silentAudio =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA='

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

  private createAudio(): HTMLAudioElement {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    return audio
  }

  private audioSource(source: string): [string, Pool][] {
    return Array.from(this.pool.entries()).filter(([, item]) => item.source === source)
  }

  private detachAudio(poolItem: Pool): void {
    poolItem.cleanupListeners?.forEach((cleanup) => {
      cleanup()
    })
    poolItem.cleanupListeners = []
  }

  private releaseAudio(poolItem: Pool): void {
    this.detachAudio(poolItem)
    poolItem.audio.src = ''
    poolItem.isPlaying = false
    this.reduceCount(poolItem.source)
    this.recycleAudio(poolItem.audio)
  }

  private reduceCount(source: string): void {
    const currentCount = this.instanceCounts.get(source) || 0
    this.instanceCounts.set(source, Math.max(0, currentCount - 1))
  }

  private removeAudio(key: string): void {
    const item = this.pool.get(key)
    if (!item) return
    this.releaseAudio(item)
    this.pool.delete(key)
  }

  private pruneOldest(): boolean {
    let lruItem: [string, Pool] | undefined
    for (const [key, item] of this.pool.entries()) {
      if (!item.isPlaying && (!lruItem || item.lastUsed < lruItem[1].lastUsed)) {
        lruItem = [key, item]
      }
    }
    if (!lruItem) return false
    this.removeAudio(lruItem[0])
    return true
  }

  private pruneSource(source: string): boolean {
    const instances = this.audioSource(source)
    if (instances.length < this.maxInstances) {
      return false
    }

    instances.sort((a, b) => a[1].lastUsed - b[1].lastUsed)
    this.removeAudio(instances[0][0])
    return true
  }

  private async warmAudio(): Promise<void> {
    if (this.initialized) return

    const warmupCount = Math.min(5, this.maxPool)
    for (let i = 0; i < warmupCount; i++) {
      const audio = this.createAudio()
      audio.src = silentAudio

      try {
        await audio.play()
        audio.pause()
        audio.currentTime = 0
        audio.src = ''
        this.unusedAudio.push(audio)
      } catch (error) {
        console.warn('Audio warmup failed:', error)
      }
    }

    this.initialized = true
  }

  private getAudio(): HTMLAudioElement {
    const audio = this.unusedAudio.pop()
    if (audio) {
      return audio
    }

    const newAudio = this.createAudio()
    newAudio.load()
    return newAudio
  }

  private recycleAudio(audio: HTMLAudioElement): void {
    audio.src = ''
    audio.load()
    if (this.unusedAudio.length < this.maxPool) {
      this.unusedAudio.push(audio)
    }
  }

  private audioListeners(poolItem: Pool): void {
    const endedListener = () => {
      poolItem.isPlaying = false
      poolItem.onEnd?.()
      this.reduceCount(poolItem.source)
      this.detachAudio(poolItem)
      this.recycleAudio(poolItem.audio)
    }

    const pauseListener = () => {
      if (!poolItem.audio.ended) {
        poolItem.isPlaying = false
        poolItem.onEnd?.()
        this.reduceCount(poolItem.source)
        this.detachAudio(poolItem)
        this.recycleAudio(poolItem.audio)
      }
    }

    const errorListener = () => {
      poolItem.isPlaying = false
      poolItem.onEnd?.()
      this.reduceCount(poolItem.source)
      const itemKey = Array.from(this.pool.entries()).find(([_, item]) => item === poolItem)?.[0]
      if (itemKey) {
        this.detachAudio(poolItem)
        this.pool.delete(itemKey)
      }
      this.recycleAudio(poolItem.audio)
    }

    poolItem.audio.addEventListener('ended', endedListener)
    poolItem.audio.addEventListener('pause', pauseListener)
    poolItem.audio.addEventListener('error', errorListener)

    poolItem.cleanupListeners = [
      () => poolItem.audio.removeEventListener('ended', endedListener),
      () => poolItem.audio.removeEventListener('pause', pauseListener),
      () => poolItem.audio.removeEventListener('error', errorListener),
    ]
  }

  private cleanupAudio(item: Pool): void {
    this.releaseAudio(item)
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
        this.pruneSource(source)
      }
    }

    if (this.pool.size >= this.maxPool) {
      if (!this.pruneOldest()) {
        const stoppedItem = this.stoppedAudio()

        if (stoppedItem) {
          const stoppedKey = Array.from(this.pool.entries()).find(
            ([_, item]) => item === stoppedItem
          )?.[0]
          if (stoppedKey) {
            this.removeAudio(stoppedKey)
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

  private stoppedAudio(): Pool | undefined {
    for (const [, item] of this.pool) {
      if (!item.isPlaying && (item.audio.ended || item.audio.paused)) {
        return item
      }
    }
    return undefined
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
    this.pool.forEach((item) => {
      this.cleanupAudio(item)
    })
    this.pool.clear()
    this.instanceCounts.clear()
  }

  stopSpecific(source: string): void {
    let itemsFound = false
    for (const [key, item] of this.pool.entries()) {
      if (item.source === source) {
        this.removeAudio(key)
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
      const playingSounds = Array.from(this.pool.entries())
        .filter(([_, item]) => item.isPlaying)
        .sort((a, b) => b[1].lastUsed - a[1].lastUsed)

      if (playingSounds.length > 1) {
        const [, mostRecentItem] = playingSounds[0]
        playingSounds.slice(1).forEach(([key]) => {
          this.removeAudio(key)
        })

        this.instanceCounts.clear()
        this.instanceCounts.set(mostRecentItem.source, 1)
      }
    }
  }

  updateRepeat(enabled: boolean): void {
    this.enableRepeat = enabled
    if (!enabled) {
      const soundGroups = new Map<string, [string, Pool][]>()

      for (const entry of this.pool.entries()) {
        const [key, item] = entry
        if (item.isPlaying) {
          const source = key.split('_')[0]
          if (!soundGroups.has(source)) {
            soundGroups.set(source, [])
          }
          soundGroups.get(source)?.push(entry)
        }
      }

      for (const [source, instances] of soundGroups) {
        if (instances.length > 1) {
          instances.sort((a, b) => b[1].lastUsed - a[1].lastUsed)

          instances.slice(1).forEach(([key]) => {
            this.removeAudio(key)
          })

          this.instanceCounts.set(source, 1)
        }
      }
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
