import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import { useSettings } from "@/context/setting"
import AudioPool from "@/utils/audio-pool"

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
  isReady: boolean
}

const AudioContext = createContext<AudioContextType>({
  playSound: async () => {},
  stopAll: () => {},
  stopSound: () => {},
  isPlaying: () => false,
  isReady: false,
})

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioPoolRef = useRef<AudioPool | null>(null)
  const { settings, isInitialized: settingsInitialized } = useSettings()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!settingsInitialized) {
      return
    }

    if (audioPoolRef.current) {
      audioPoolRef.current.updateMultiSoundEnabled(settings.multiSoundEnabled)
      audioPoolRef.current.updateRepeatSoundEnabled(settings.repeatSoundEnabled)
      audioPoolRef.current.stopAll()
    }

    audioPoolRef.current = new AudioPool(
      settings.maxPoolSize,
      settings.maxInstancesPerSound,
      settings.multiSoundEnabled,
      settings.repeatSoundEnabled
    )

    if (settings.volume >= 0 && settings.volume <= 1) {
      audioPoolRef.current.updateVolume(settings.volume)
    }

    setIsReady(true)
  }, [
    settingsInitialized,
    settings.multiSoundEnabled,
    settings.repeatSoundEnabled,
    settings.maxPoolSize,
    settings.maxInstancesPerSound,
  ])

  useEffect(() => {
    if (!audioPoolRef.current || !isReady) {
      return
    }

    if (settings.volume >= 0 && settings.volume <= 1) {
      audioPoolRef.current.updateVolume(settings.volume)
    }
  }, [settings.volume, isReady])

  const playSound = async (
    soundId: string,
    file: string,
    isUserAdded: boolean,
    volume?: number,
    repeatEnabled?: boolean
  ) => {
    if (!audioPoolRef.current || !isReady) {
      console.warn("Audio system not ready")
      return
    }

    try {
      await audioPoolRef.current.play(
        file,
        isUserAdded,
        volume ?? settings.volume,
        repeatEnabled ?? settings.repeatSoundEnabled
      )
    } catch (error: unknown) {
      console.error("Error playing sound:", error)
      if (audioPoolRef.current) {
        audioPoolRef.current.stopSpecific(file)
      }
    }
  }

  const stopAll = () => {
    if (!audioPoolRef.current || !isReady) {
      return
    }

    audioPoolRef.current.stopAll()
  }

  const stopSound = (file: string) => {
    if (!audioPoolRef.current || !isReady) {
      return
    }

    audioPoolRef.current.stopSpecific(file)
  }

  const isPlaying = (file: string) => {
    if (!audioPoolRef.current || !isReady) {
      return false
    }

    return audioPoolRef.current.isPlaying(file)
  }

  return (
    <AudioContext.Provider
      value={{ playSound, stopAll, stopSound, isPlaying, isReady }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider")
  }

  return context
}

export default AudioContext
