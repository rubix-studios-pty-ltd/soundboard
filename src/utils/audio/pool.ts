import type { Pool } from '@/types/pool'

const silentAudio =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA='

class AudioPool {
  private pool: Map<string, Pool>
  private maxPoolSize: number
  private maxInstancesPerSound: number
  private multiSoundEnabled: boolean
  private repeatSoundEnabled: boolean
  private unusedAudioElements: HTMLAudioElement[]
  private instanceCounts: Map<string, number>
  private audioContext: AudioContext
  private initialized: boolean
  private loadingSounds: Set<string>
  private initializationPromise: Promise<void> | null

  constructor(
    maxPoolSize: number = 100,
    maxInstancesPerSound: number = 20,
    multiSoundEnabled: boolean = true,
    repeatSoundEnabled: boolean = false
  ) {
    this.pool = new Map()
    this.maxPoolSize = maxPoolSize
    this.maxInstancesPerSound = maxInstancesPerSound
    this.unusedAudioElements = []
    this.instanceCounts = new Map()
    this.multiSoundEnabled = multiSoundEnabled
    this.repeatSoundEnabled = repeatSoundEnabled
    this.initialized = false
    this.audioContext = new AudioContext()
    this.loadingSounds = new Set()
    this.initializationPromise = null

    document.addEventListener(
      'click',
      () => {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume()
        }
      },
      { once: true }
    )

    this.initializationPromise = this.initializeAudioSystem()
  }

  private decrementInstanceCount(source: string): void {
    const currentCount = this.instanceCounts.get(source) || 0
    this.instanceCounts.set(source, Math.max(0, currentCount - 1))
  }

  private createAudioElement(): HTMLAudioElement {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    return audio
  }

  private getEntriesForSource(source: string): [string, Pool][] {
    return Array.from(this.pool.entries()).filter(([, item]) => item.source === source)
  }

  private detachAudioListeners(poolItem: Pool): void {
    poolItem.cleanupListeners?.forEach((cleanup) => {
      cleanup()
    })
    poolItem.cleanupListeners = []
  }

  private releaseAudioItem(poolItem: Pool): void {
    this.detachAudioListeners(poolItem)
    poolItem.audio.src = ''
    poolItem.isPlaying = false
    this.decrementInstanceCount(poolItem.source)
    this.recycleAudioElement(poolItem.audio)
  }

  private removePoolEntry(key: string): void {
    const item = this.pool.get(key)
    if (!item) {
      return
    }

    this.releaseAudioItem(item)
    this.pool.delete(key)
  }

  private pruneOldestAvailableItem(): boolean {
    let lruItem: [string, Pool] | undefined

    for (const [key, item] of this.pool.entries()) {
      if (!item.isPlaying && (!lruItem || item.lastUsed < lruItem[1].lastUsed)) {
        lruItem = [key, item]
      }
    }

    if (!lruItem) {
      return false
    }

    this.removePoolEntry(lruItem[0])
    return true
  }

  private pruneOldestInstanceForSource(source: string): boolean {
    const instances = this.getEntriesForSource(source)

    if (instances.length < this.maxInstancesPerSound) {
      return false
    }

    instances.sort((a, b) => a[1].lastUsed - b[1].lastUsed)
    this.removePoolEntry(instances[0][0])
    return true
  }

  private async initializeAudioSystem(): Promise<void> {
    if (this.initialized) {
      return
    }

    const warmupCount = Math.min(5, this.maxPoolSize)

    for (let i = 0; i < warmupCount; i++) {
      const audio = this.createAudioElement()
      audio.src = silentAudio

      try {
        await audio.play()
        audio.pause()
        audio.currentTime = 0
        audio.src = ''
        this.unusedAudioElements.push(audio)
      } catch (error) {
        console.warn('Audio warmup failed:', error)
      }
    }

    this.initialized = true
  }

  async play(
    source: string,
    isUserAdded: boolean,
    volume: number,
    repeat: boolean = false,
    onEnd?: () => void
  ): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise
    }

    if (!this.initialized) {
      console.warn('Audio system not initialized yet')
      return
    }

    if (this.loadingSounds.has(source)) {
      return
    }

    if (!this.multiSoundEnabled) {
      if (this.repeatSoundEnabled) {
        for (const [key, item] of this.pool.entries()) {
          if (item.source !== source) {
            this.cleanupAudioItem(item)
            this.pool.delete(key)
          }
        }
      } else {
        this.stopAll()
      }
    } else if (!this.repeatSoundEnabled) {
      this.stopSpecific(source)
    }

    try {
      this.loadingSounds.add(source)
      await this.playFromUrl(
        source,
        source,
        isUserAdded,
        volume,
        this.repeatSoundEnabled && repeat,
        onEnd
      )
    } finally {
      this.loadingSounds.delete(source)
    }
  }

  private getAudioElement(): HTMLAudioElement {
    const audio = this.unusedAudioElements.pop()
    if (audio) {
      return audio
    }

    const newAudio = this.createAudioElement()
    newAudio.load()
    return newAudio
  }

  private recycleAudioElement(audio: HTMLAudioElement): void {
    audio.src = ''
    audio.load()
    if (this.unusedAudioElements.length < this.maxPoolSize) {
      this.unusedAudioElements.push(audio)
    }
  }

  private setupAudioListeners(poolItem: Pool): void {
    const endedListener = () => {
      poolItem.isPlaying = false
      poolItem.onEnd?.()
      this.decrementInstanceCount(poolItem.source)
      this.detachAudioListeners(poolItem)
      this.recycleAudioElement(poolItem.audio)
    }

    const pauseListener = () => {
      if (!poolItem.audio.ended) {
        poolItem.isPlaying = false
        poolItem.onEnd?.()
        this.decrementInstanceCount(poolItem.source)
      }
    }

    const errorListener = () => {
      poolItem.isPlaying = false
      poolItem.onEnd?.()
      this.decrementInstanceCount(poolItem.source)
      const itemKey = Array.from(this.pool.entries()).find(([_, item]) => item === poolItem)?.[0]
      if (itemKey) {
        this.detachAudioListeners(poolItem)
        this.pool.delete(itemKey)
      }
      this.recycleAudioElement(poolItem.audio)
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

  private cleanupAudioItem(item: Pool): void {
    this.releaseAudioItem(item)
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
        finalUrl = await window.electronAPI.resolveUserSoundPath(url)
      } catch (error) {
        console.error('Error resolving user sound path:', error)
        finalUrl = url
      }
    }

    if (repeat) {
      const currentCount = this.instanceCounts.get(source) || 0
      if (currentCount >= this.maxInstancesPerSound) {
        this.pruneOldestInstanceForSource(source)
      }
    }

    if (this.pool.size >= this.maxPoolSize) {
      if (!this.pruneOldestAvailableItem()) {
        const stoppedItem = this.findStoppedAudio()
        if (stoppedItem) {
          const stoppedKey = Array.from(this.pool.entries()).find(
            ([_, item]) => item === stoppedItem
          )?.[0]
          if (stoppedKey) {
            this.removePoolEntry(stoppedKey)
          }
        } else {
          console.warn('Audio pool is full. Cannot play more sounds simultaneously.')
          return
        }
      }
    }

    try {
      const audioElement = this.getAudioElement()

      const poolItem: Pool = {
        audio: audioElement,
        source,
        isPlaying: false,
        cleanupListeners: [],
        onEnd,
        lastUsed: Date.now(),
      }

      this.setupAudioListeners(poolItem)
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
        this.cleanupAudioItem(item)
        this.pool.delete(instanceId)
      }
      throw error
    }
  }

  stopAll(): void {
    this.pool.forEach((item) => {
      this.cleanupAudioItem(item)
    })
    this.pool.clear()
    this.instanceCounts.clear()
  }

  stopSpecific(source: string): void {
    let itemsFound = false
    for (const [key, item] of this.pool.entries()) {
      if (item.source === source) {
        this.removePoolEntry(key)
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

  updateMultiSoundEnabled(enabled: boolean): void {
    this.multiSoundEnabled = enabled
    if (!enabled) {
      const playingSounds = Array.from(this.pool.entries())
        .filter(([_, item]) => item.isPlaying)
        .sort((a, b) => b[1].lastUsed - a[1].lastUsed)

      if (playingSounds.length > 1) {
        const [, mostRecentItem] = playingSounds[0]
        playingSounds.slice(1).forEach(([key]) => {
          this.removePoolEntry(key)
        })

        this.instanceCounts.clear()
        this.instanceCounts.set(mostRecentItem.source, 1)
      }
    }
  }

  updateRepeatSoundEnabled(enabled: boolean): void {
    this.repeatSoundEnabled = enabled
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
            this.removePoolEntry(key)
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

  getAudio(source: string): HTMLAudioElement | undefined {
    const entries = Array.from(this.pool.entries())
      .filter(([, item]) => item.source === source)
      .sort((a, b) => b[1].lastUsed - a[1].lastUsed)

    return entries[0]?.[1].audio
  }

  getPlayingAudios(): Map<string, Pool> {
    return this.pool
  }

  private findStoppedAudio(): Pool | undefined {
    for (const [, item] of this.pool) {
      if (!item.isPlaying && (item.audio.ended || item.audio.paused)) {
        return item
      }
    }
    return undefined
  }

  getInstanceCount(source: string): number {
    return this.instanceCounts.get(source) || 0
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
    this.unusedAudioElements.forEach((audio) => {
      audio.src = ''
      audio.load()
    })
    this.unusedAudioElements = []
    this.initialized = false
    this.initializationPromise = null
  }
}

export default AudioPool
