export interface AudioPoolItem {
  audio: HTMLAudioElement
  source: string
  isPlaying: boolean
  cleanupListeners: (() => void)[]
  onEnd?: () => void
  lastUsed: number
}

class AudioPool {
  private pool: Map<string, AudioPoolItem>
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
      "click",
      () => {
        if (this.audioContext.state === "suspended") {
          this.audioContext.resume()
        }
      },
      { once: true }
    )

    this.initializationPromise = this.initializeAudioSystem()
  }

  private async initializeAudioSystem(): Promise<void> {
    if (this.initialized) {
      return
    }

    const silentAudio =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA="
    const warmupCount = Math.min(5, this.maxPoolSize)

    for (let i = 0; i < warmupCount; i++) {
      const audio = new Audio()
      audio.preload = "auto"
      audio.crossOrigin = "anonymous"
      audio.src = silentAudio

      try {
        await audio.play()
        audio.pause()
        audio.currentTime = 0
        audio.src = ""
        this.unusedAudioElements.push(audio)
      } catch (error) {
        console.warn("Audio warmup failed:", error)
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
      console.warn("Audio system not initialized yet")
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

    const newAudio = new Audio()
    newAudio.preload = "auto"
    newAudio.crossOrigin = "anonymous"
    newAudio.load()
    return newAudio
  }

  private recycleAudioElement(audio: HTMLAudioElement): void {
    audio.src = ""
    audio.load()
    if (this.unusedAudioElements.length < this.maxPoolSize) {
      this.unusedAudioElements.push(audio)
    }
  }

  private setupAudioListeners(poolItem: AudioPoolItem): void {
    const decrementInstanceCount = (source: string) => {
      const currentCount = this.instanceCounts.get(source) || 0
      this.instanceCounts.set(source, Math.max(0, currentCount - 1))
    }

    const endedListener = () => {
      poolItem.isPlaying = false
      poolItem.onEnd?.()
      if (poolItem.source) {
        decrementInstanceCount(poolItem.source)
      }
      this.recycleAudioElement(poolItem.audio)
    }

    const pauseListener = () => {
      if (!poolItem.audio.ended) {
        poolItem.isPlaying = false
        poolItem.onEnd?.()
        if (poolItem.source) {
          decrementInstanceCount(poolItem.source)
        }
      }
    }

    const errorListener = () => {
      poolItem.isPlaying = false
      poolItem.onEnd?.()
      if (poolItem.source) {
        decrementInstanceCount(poolItem.source)
      }
      const itemKey = Array.from(this.pool.entries()).find(
        ([_, item]) => item === poolItem
      )?.[0]
      if (itemKey) {
        this.pool.delete(itemKey)
      }
      this.recycleAudioElement(poolItem.audio)
    }

    poolItem.audio.addEventListener("ended", endedListener)
    poolItem.audio.addEventListener("pause", pauseListener)
    poolItem.audio.addEventListener("error", errorListener)

    poolItem.cleanupListeners = [
      () => poolItem.audio.removeEventListener("ended", endedListener),
      () => poolItem.audio.removeEventListener("pause", pauseListener),
      () => poolItem.audio.removeEventListener("error", errorListener),
    ]
  }

  private cleanupAudioItem(item: AudioPoolItem): void {
    item.cleanupListeners?.forEach((cleanup) => cleanup())
    item.audio.src = ""
    item.isPlaying = false
    if (item.source) {
      const currentCount = this.instanceCounts.get(item.source) || 0
      this.instanceCounts.set(item.source, Math.max(0, currentCount - 1))
    }
    this.recycleAudioElement(item.audio)
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
        const userDataPath = await window.electronAPI.getAppDataPath()
        const filePath = `${userDataPath}/sounds/${url}`
        finalUrl = `file://${filePath}`
      } catch (error) {
        console.error("Error getting app data path:", error)
        finalUrl = url
      }
    }

    if (repeat) {
      const currentCount = this.instanceCounts.get(source) || 0
      if (currentCount >= this.maxInstancesPerSound) {
        let oldestKey: string | undefined
        let oldestTime = Date.now()

        for (const [key, item] of this.pool.entries()) {
          if (key.startsWith(source) && item.lastUsed < oldestTime) {
            oldestKey = key
            oldestTime = item.lastUsed
          }
        }

        if (oldestKey) {
          const item = this.pool.get(oldestKey)
          if (item) {
            item.cleanupListeners?.forEach((cleanup) => cleanup())
            item.audio.src = ""
            item.isPlaying = false
            this.recycleAudioElement(item.audio)
            this.pool.delete(oldestKey)
          }
        }
      }
    }

    if (this.pool.size >= this.maxPoolSize) {
      let lruItem: [string, AudioPoolItem] | undefined
      for (const [key, item] of this.pool.entries()) {
        if (
          !item.isPlaying &&
          (!lruItem || item.lastUsed < lruItem[1].lastUsed)
        ) {
          lruItem = [key, item]
        }
      }
      if (lruItem) {
        lruItem[1].cleanupListeners?.forEach((cleanup) => cleanup())
        lruItem[1].audio.src = ""
        lruItem[1].isPlaying = false
        this.recycleAudioElement(lruItem[1].audio)
        this.pool.delete(lruItem[0])
      } else {
        const stoppedItem = this.findStoppedAudio()
        if (stoppedItem) {
          const stoppedKey = Array.from(this.pool.entries()).find(
            ([_, item]) => item === stoppedItem
          )?.[0]
          if (stoppedKey) {
            stoppedItem.cleanupListeners?.forEach((cleanup) => cleanup())
            stoppedItem.audio.src = ""
            stoppedItem.isPlaying = false
            this.recycleAudioElement(stoppedItem.audio)
            this.pool.delete(stoppedKey)
          }
        } else {
          console.warn(
            "Audio pool is full. Cannot play more sounds simultaneously."
          )
          return
        }
      }
    }

    try {
      const audioElement = this.getAudioElement()

      const poolItem: AudioPoolItem = {
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

      await audioElement.play()
      poolItem.isPlaying = true
      poolItem.lastUsed = Date.now()

      const currentCount = this.instanceCounts.get(source) || 0
      this.instanceCounts.set(source, currentCount + 1)
    } catch (error) {
      console.error("Error playing audio:", error)
      this.stopSpecific(source)
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
      if (key.startsWith(source)) {
        this.cleanupAudioItem(item)
        this.pool.delete(key)
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
        const [mostRecentKey] = playingSounds[0]
        playingSounds.slice(1).forEach(([key]) => {
          const item = this.pool.get(key)
          if (item) {
            this.cleanupAudioItem(item)
            this.pool.delete(key)
          }
        })

        this.instanceCounts.clear()
        if (mostRecentKey) {
          const source = mostRecentKey.split("_")[0]
          this.instanceCounts.set(source, 1)
        }
      }
    }
  }

  updateRepeatSoundEnabled(enabled: boolean): void {
    this.repeatSoundEnabled = enabled
    if (!enabled) {
      const soundGroups = new Map<string, [string, AudioPoolItem][]>()

      for (const entry of this.pool.entries()) {
        const [key, item] = entry
        if (item.isPlaying) {
          const source = key.split("_")[0]
          if (!soundGroups.has(source)) {
            soundGroups.set(source, [])
          }
          soundGroups.get(source)?.push(entry)
        }
      }

      for (const [source, instances] of soundGroups) {
        if (instances.length > 1) {
          instances.sort((a, b) => b[1].lastUsed - a[1].lastUsed)

          instances.slice(1).forEach(([key, item]) => {
            this.cleanupAudioItem(item)
            this.pool.delete(key)
          })

          this.instanceCounts.set(source, 1)
        }
      }
    }
  }

  isPlaying(source: string): boolean {
    for (const [key, item] of this.pool.entries()) {
      if (key.startsWith(source) && item.isPlaying) {
        return true
      }
    }
    return false
  }

  getAudio(source: string): HTMLAudioElement | undefined {
    const item = this.pool.get(source)
    return item?.audio
  }

  getPlayingAudios(): Map<string, AudioPoolItem> {
    return this.pool
  }

  private findStoppedAudio(): AudioPoolItem | undefined {
    for (const [, item] of this.pool) {
      if (!item.isPlaying && (item.audio.ended || item.audio.paused)) {
        return item
      }
    }
    return undefined
  }
}

export default AudioPool
