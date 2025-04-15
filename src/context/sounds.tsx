import React, { createContext, useCallback, useContext, useState } from "react"

import { SoundData } from "@/types"
import { soundData as initialSounds } from "@/data/audio"
import { musicData as initialMusic } from "@/data/music"

interface SoundsContextType {
  sounds: SoundData[]
  music: SoundData[]
  addSound: (sound: SoundData, type: "sound" | "music") => void
}

const SoundsContext = createContext<SoundsContextType | null>(null)

export const SoundsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sounds, setSounds] = useState<SoundData[]>(initialSounds)
  const [music, setMusic] = useState<SoundData[]>(initialMusic)

  const addSound = useCallback((sound: SoundData, type: "sound" | "music") => {
    if (type === "sound") {
      setSounds((prev) => [...prev, sound])
    } else {
      setMusic((prev) => [...prev, sound])
    }
  }, [])

  return (
    <SoundsContext.Provider
      value={{
        sounds,
        music,
        addSound,
      }}
    >
      {children}
    </SoundsContext.Provider>
  )
}

export const useSounds = () => {
  const context = useContext(SoundsContext)
  if (!context) {
    throw new Error("useSounds must be used within a SoundsProvider")
  }
  return context
}

export default SoundsContext
