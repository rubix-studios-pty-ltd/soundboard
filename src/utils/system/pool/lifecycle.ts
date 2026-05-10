const silentAudio =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQAAAAA='

export function createElement(): HTMLAudioElement {
  const audio = new Audio()
  audio.preload = 'auto'
  audio.crossOrigin = 'anonymous'
  return audio
}

export async function warmPool(
  initialized: boolean,
  maxPool: number,
  unusedAudio: HTMLAudioElement[]
): Promise<void> {
  if (initialized) return

  const warmupCount = Math.min(5, maxPool)
  for (let i = 0; i < warmupCount; i++) {
    const audio = createElement()
    audio.src = silentAudio

    try {
      await audio.play()
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
      unusedAudio.push(audio)
    } catch (error) {
      console.warn('Audio warmup failed:', error)
    }
  }
}

export function getElement(
  unusedAudio: HTMLAudioElement[],
  createAudio: () => HTMLAudioElement
): HTMLAudioElement {
  const audio = unusedAudio.pop()
  if (audio) {
    return audio
  }

  const newAudio = createAudio()
  newAudio.load()
  return newAudio
}

export function recycleAudio(
  audio: HTMLAudioElement,
  unusedAudio: HTMLAudioElement[],
  maxPool: number
): void {
  audio.src = ''
  audio.load()

  if (unusedAudio.length < maxPool) {
    unusedAudio.push(audio)
  }
}
