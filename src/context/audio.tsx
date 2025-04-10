import React, { createContext, useContext, useEffect, useRef } from "react"

import { useSettings } from "@/context/setting"
import AudioPool from "@/utils/audio-pool"
import { audioDB } from "@/utils/indexed-db"

interface AudioContextType {
  playSound: (soundId: string, file: string) => Promise<void>
  stopAll: () => void
  stopSound: (file: string) => void
  isPlaying: (file: string) => boolean
}

const AudioContext = createContext<AudioContextType>({
  playSound: async () => {},
  stopAll: () => {},
  stopSound: () => {},
  isPlaying: () => false,
})

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioPoolRef = useRef<AudioPool>(new AudioPool())
  const { settings } = useSettings()

  useEffect(() => {
    if (settings.volume >= 0 && settings.volume <= 1) {
      audioPoolRef.current.updateVolume(settings.volume)
    }
  }, [settings.volume])

  useEffect(() => {
    audioPoolRef.current.updateMultiSoundEnabled(settings.multiSoundEnabled)
  }, [settings.multiSoundEnabled])

  useEffect(() => {
    audioPoolRef.current.updateRepeatSoundEnabled(settings.repeatSoundEnabled)
  }, [settings.repeatSoundEnabled])

  const playSound = async (soundId: string, file: string) => {
    try {
      if (!audioPoolRef.current.isPreloaded(file)) {
        const response = await fetch(file)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        try {
          await audioDB.store(file, blob)
        } catch (error) {
          console.error("Error storing sound in IndexedDB:", error)
        }

        audioPoolRef.current.preloadSound(url, file)
      }

      await audioPoolRef.current.play(file, settings.volume)
    } catch (error) {
      console.error("Error playing sound:", error)
      audioPoolRef.current.stopSpecific(file)
    }
  }

  const stopAll = () => {
    audioPoolRef.current.stopAll()
  }

  const stopSound = (file: string) => {
    audioPoolRef.current.stopSpecific(file)
  }

  const isPlaying = (file: string) => {
    return audioPoolRef.current.isPlaying(file)
  }

  return (
    <AudioContext.Provider value={{ playSound, stopAll, stopSound, isPlaying }}>
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
