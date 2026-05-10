import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react'

import { useSettings } from '@/context/setting'
import { AudioPool } from '@/utils/system/pool'

interface AudioContextType {
  playSound: (
    soundId: string,
    file: string,
    isUserAdded: boolean,
    volume?: number,
    repeatEnabled?: boolean
  ) => Promise<void>
  stopAll: () => void
  stopSound: (file: string) => void
  isPlaying: (file: string) => boolean
  initialized: boolean
}

const AudioContext = createContext<AudioContextType>({
  playSound: async () => {},
  stopAll: () => {},
  stopSound: () => {},
  isPlaying: () => false,
  initialized: false,
})

export function AudioProvider({ children }: { children: ReactNode }) {
  const { settings, isInitialized: initialized } = useSettings()

  const audioPoolRef = useRef<AudioPool | null>(null)
  const stopAllHandlerRef = useRef<((...args: unknown[]) => void) | null>(null)

  useEffect(() => {
    if (!initialized) {
      return
    }

    audioPoolRef.current?.dispose()
    const pool = new AudioPool(settings.enableMulti, settings.enableRepeat)
    audioPoolRef.current = pool

    return () => {
      pool.dispose()
      if (audioPoolRef.current === pool) {
        audioPoolRef.current = null
      }
    }
  }, [initialized, settings.enableMulti, settings.enableRepeat])

  useEffect(() => {
    if (!audioPoolRef.current || !initialized) {
      return
    }

    audioPoolRef.current.updateVolume(settings.volume)
  }, [settings.volume, initialized])

  useEffect(() => {
    if (!audioPoolRef.current || !initialized) {
      return
    }

    if (settings.volume >= 0 && settings.volume <= 1) {
      audioPoolRef.current.updateVolume(settings.volume)
    }
  }, [settings.volume, initialized])

  useEffect(() => {
    const handleStopAllAudio = () => {
      audioPoolRef.current?.stopAll()
    }

    stopAllHandlerRef.current = handleStopAllAudio
    window.electronAPI.on('stop-all-audio', handleStopAllAudio)

    return () => {
      if (stopAllHandlerRef.current) {
        window.electronAPI.off('stop-all-audio', stopAllHandlerRef.current)
        stopAllHandlerRef.current = null
      }
    }
  }, [])

  const playSound = async (
    _soundId: string,
    file: string,
    isUserAdded: boolean,
    volume?: number,
    repeatEnabled?: boolean
  ) => {
    if (!audioPoolRef.current || !initialized) {
      console.warn('Audio system not ready')
      return
    }

    try {
      await audioPoolRef.current.playAudio(
        file,
        isUserAdded,
        volume ?? settings.volume,
        repeatEnabled ?? settings.enableRepeat
      )
    } catch (error: unknown) {
      console.error('Error playing sound:', error)
      if (audioPoolRef.current) {
        audioPoolRef.current.stopSpecific(file)
      }
    }
  }

  const stopAll = () => {
    if (!audioPoolRef.current || !initialized) {
      return
    }

    if (stopAllHandlerRef.current) {
      window.electronAPI.off('stop-all-audio', stopAllHandlerRef.current)
    }

    audioPoolRef.current.stopAll()
    window.electronAPI.stopAllSounds()

    if (stopAllHandlerRef.current) {
      window.electronAPI.on('stop-all-audio', stopAllHandlerRef.current)
    }
  }

  const stopSound = (file: string) => {
    if (!audioPoolRef.current || !initialized) {
      return
    }

    audioPoolRef.current.stopSpecific(file)
  }

  const isPlaying = (file: string) => {
    if (!audioPoolRef.current || !initialized) {
      return false
    }

    return audioPoolRef.current.isPlaying(file)
  }

  return (
    <AudioContext.Provider value={{ playSound, stopAll, stopSound, isPlaying, initialized }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }

  return context
}
