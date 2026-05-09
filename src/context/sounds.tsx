import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useSound } from '@/hooks/useSound'
import type { SoundData } from '@/types/sound'
import { generateId } from '@/utils/sound/generateId'
import { getMusic } from '@/utils/sound/getMusic'
import { getSound } from '@/utils/sound/getSound'

interface SoundsContextType {
  sounds: SoundData[]
  music: SoundData[]
  addSound: (sound: SoundData, type: 'sound' | 'music') => Promise<void>
  removeSound: (sound: SoundData, type: 'sound' | 'music') => Promise<void>
  isLoading: boolean
}

const SoundsContext = createContext<SoundsContextType | null>(null)

export function SoundsProvider({ children }: { children: ReactNode }) {
  const {
    userSounds: userRegularSounds,
    loading: loadingRegularSounds,
    addUserSound: addRegularSound,
    removeUserSound: removeRegularSound,
  } = useSound('sound')
  const {
    userSounds: userMusicSounds,
    loading: loadingMusicSounds,
    addUserSound: addMusicSound,
    removeUserSound: removeMusicSound,
  } = useSound('music')

  const [sounds, setSounds] = useState<SoundData[]>([])
  const [music, setMusic] = useState<SoundData[]>([])

  const initialSounds = useMemo(
    () =>
      getSound().map((sound) => ({
        ...sound,
        id: generateId(sound.file),
      })),
    []
  )

  const initialMusic = useMemo(
    () =>
      getMusic().map((sound) => ({
        ...sound,
        id: generateId(sound.file),
      })),
    []
  )

  useEffect(() => {
    const soundMap = new Map<string, SoundData>()

    initialSounds.forEach((sound) => {
      soundMap.set(sound.file, sound)
    })

    userRegularSounds.forEach((sound) => {
      if (!soundMap.has(sound.file)) {
        soundMap.set(sound.file, sound)
      }
    })

    setSounds(Array.from(soundMap.values()))
  }, [initialSounds, userRegularSounds])

  useEffect(() => {
    const musicMap = new Map<string, SoundData>()

    initialMusic.forEach((sound) => {
      musicMap.set(sound.file, sound)
    })

    userMusicSounds.forEach((sound) => {
      if (!musicMap.has(sound.file)) {
        musicMap.set(sound.file, sound)
      }
    })

    setMusic(Array.from(musicMap.values()))
  }, [initialMusic, userMusicSounds])

  const addSound = useCallback(
    async (sound: SoundData, type: 'sound' | 'music') => {
      const processedSound = {
        ...sound,
        id: sound.id || generateId(sound.file),
        isUserAdded: true,
      }
      await window.electronAPI.addSound({ sound: processedSound, type })
      if (type === 'sound') {
        addRegularSound(processedSound)
      } else {
        addMusicSound(processedSound)
      }
    },
    [addRegularSound, addMusicSound]
  )

  const removeSound = useCallback(
    async (sound: SoundData, type: 'sound' | 'music') => {
      try {
        if (type === 'sound') {
          removeRegularSound(sound.id)
        } else {
          removeMusicSound(sound.id)
        }

        await window.electronAPI.deleteSound({ sound, type }).catch((error) => {
          if (type === 'sound') {
            addRegularSound(sound)
          } else {
            addMusicSound(sound)
          }
          throw error
        })
      } catch (error) {
        console.error('Error in removeSound:', error)
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
    throw new Error('useSounds must be used within a SoundsProvider')
  }
  return context
}
