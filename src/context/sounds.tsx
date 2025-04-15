import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { SoundData } from "@/types"
import { useUserSounds } from "@/hooks/useUserSounds"
import { generateSoundId } from "@/utils/sound-id"
import { soundData as initialSounds } from "@/data/audio"
import { musicData as initialMusic } from "@/data/music"

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
  const processedInitialSounds = useMemo(
    () =>
      initialSounds.map((sound) => ({
        ...sound,
        id: generateSoundId(sound.file),
      })),
    []
  )

  const processedInitialMusic = useMemo(
    () =>
      initialMusic.map((sound) => ({
        ...sound,
        id: generateSoundId(sound.file),
      })),
    []
  )

  const [sounds, setSounds] = useState<SoundData[]>([])
  const [music, setMusic] = useState<SoundData[]>([])

  const {
    userSounds: userRegularSounds,
    loading: loadingRegularSounds,
    addUserSound: addRegularSound,
    removeUserSound: removeRegularSound,
  } = useUserSounds("sound")

  const {
    userSounds: userMusicSounds,
    loading: loadingMusicSounds,
    addUserSound: addMusicSound,
    removeUserSound: removeMusicSound,
  } = useUserSounds("music")

  useEffect(() => {
    const soundMap = new Map<string, SoundData>()

    processedInitialSounds.forEach((sound) => {
      soundMap.set(sound.file, sound)
    })

    userRegularSounds.forEach((sound) => {
      if (!soundMap.has(sound.file)) {
        soundMap.set(sound.file, sound)
      }
    })

    setSounds(Array.from(soundMap.values()))
  }, [processedInitialSounds, userRegularSounds])

  useEffect(() => {
    const musicMap = new Map<string, SoundData>()

    processedInitialMusic.forEach((sound) => {
      musicMap.set(sound.file, sound)
    })

    userMusicSounds.forEach((sound) => {
      if (!musicMap.has(sound.file)) {
        musicMap.set(sound.file, sound)
      }
    })

    setMusic(Array.from(musicMap.values()))
  }, [processedInitialMusic, userMusicSounds])

  const addSound = useCallback(
    async (sound: SoundData, type: "sound" | "music") => {
      const processedSound = {
        ...sound,
        id: sound.id || generateSoundId(sound.file),
        isUserAdded: true,
      }
      await window.electronAPI.addSound({ sound: processedSound, type })
      if (type === "sound") {
        addRegularSound(processedSound)
      } else {
        addMusicSound(processedSound)
      }
    },
    [addRegularSound, addMusicSound]
  )

  const removeSound = useCallback(
    async (sound: SoundData, type: "sound" | "music") => {
      try {
        if (type === "sound") {
          removeRegularSound(sound.id)
        } else {
          removeMusicSound(sound.id)
        }

        await window.electronAPI.deleteSound({ sound, type }).catch((error) => {
          if (type === "sound") {
            addRegularSound(sound)
          } else {
            addMusicSound(sound)
          }
          throw error
        })
      } catch (error) {
        console.error("Error in removeSound:", error)
        throw error
      }
    },
    [removeRegularSound, removeMusicSound, addRegularSound, addMusicSound]
  )

  return (
    <SoundsContext.Provider
      value={{
        sounds,
        music,
        addSound,
        removeSound,
        isLoading: loadingRegularSounds || loadingMusicSounds,
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
