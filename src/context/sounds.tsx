import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react"

import { SoundData } from "@/types"
import { generateSoundId } from "@/utils/sound-id"
import { soundData as initialSounds } from "@/data/audio"
import { musicData as initialMusic } from "@/data/music"
import { useUserSounds } from "@/hooks/useUserSounds"

interface SoundsContextType {
  sounds: SoundData[]
  music: SoundData[]
  addSound: (sound: SoundData, type: "sound" | "music") => Promise<void>
  removeSound: (sound: SoundData, type: "sound" | "music") => Promise<void>
  isLoading: boolean
}

const SoundsContext = createContext<SoundsContextType | null>(null)

export const SoundsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const processedInitialSounds = useMemo(() => 
    initialSounds.map(sound => ({
      ...sound,
      id: generateSoundId(sound.file)
    })), [])

  const processedInitialMusic = useMemo(() => 
    initialMusic.map(sound => ({
      ...sound,
      id: generateSoundId(sound.file)
    })), [])

  const [sounds, setSounds] = useState<SoundData[]>([])
  const [music, setMusic] = useState<SoundData[]>([])

  const { 
    userSounds: userRegularSounds, 
    loading: loadingRegularSounds,
    addUserSound: addRegularSound,
    reloadSounds: reloadRegularSounds
  } = useUserSounds("sound")

  const { 
    userSounds: userMusicSounds, 
    loading: loadingMusicSounds,
    addUserSound: addMusicSound,
    reloadSounds: reloadMusicSounds
  } = useUserSounds("music")

  useEffect(() => {
    setSounds([...processedInitialSounds, ...userRegularSounds])
  }, [processedInitialSounds, userRegularSounds])

  useEffect(() => {
    setMusic([...processedInitialMusic, ...userMusicSounds])
  }, [processedInitialMusic, userMusicSounds])


  const addSound = useCallback(async (sound: SoundData, type: "sound" | "music") => {
    const processedSound = {
      ...sound,
      id: generateSoundId(sound.file),
      isUserAdded: true
    }
    await window.electronAPI.addSound({ sound: processedSound, type })
    if (type === "sound") {
      addRegularSound(processedSound)
    } else {
      addMusicSound(processedSound)
    }
  }, [addRegularSound, addMusicSound])

  const removeSound = useCallback(async (sound: SoundData, type: "sound" | "music") => {
    try {
      await window.electronAPI.deleteSound({ sound, type })
      if (type === "sound") {
        reloadRegularSounds()
      } else {
        reloadMusicSounds()
      }
    } catch (error) {
      console.error("Error removing sound:", error)
      throw error
    }
  }, [reloadRegularSounds, reloadMusicSounds])

  return (
    <SoundsContext.Provider
      value={{
        sounds,
        music,
        addSound,
        removeSound,
        isLoading: loadingRegularSounds || loadingMusicSounds
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
