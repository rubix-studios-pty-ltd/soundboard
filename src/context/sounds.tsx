import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react'

import { useSound } from '@/hooks/useSound'
import { type SoundData, type SoundsContextType, type SoundType } from '@/types/sound'
import { generateId } from '@/utils/audio/generateId'
import { mergeAudio } from '@/utils/audio/mergeAudio'
import { getMusic } from '@/utils/getMusic'
import { getSound } from '@/utils/getSound'

const SoundsContext = createContext<SoundsContextType | null>(null)

export function SoundsProvider({ children }: { children: ReactNode }) {
  const soundState = useSound('sound')
  const musicState = useSound('music')
  const setSound = getSound()
  const setMusic = getMusic()

  const sounds = useMemo(
    () => mergeAudio(setSound, soundState.userSounds),
    [setSound, soundState.userSounds]
  )

  const music = useMemo(
    () => mergeAudio(setMusic, musicState.userSounds),
    [setMusic, musicState.userSounds]
  )

  const addSound = useCallback(
    async (sound: SoundData, type: SoundType) => {
      const processedSound: SoundData = {
        ...sound,
        id: sound.id || generateId(sound.file),
        isUserAdded: true,
      }

      await window.electronAPI.addSound({
        sound: processedSound,
        type,
      })

      if (type === 'sound') {
        soundState.addUserSound(processedSound)
        return
      }

      musicState.addUserSound(processedSound)
    },
    [soundState, musicState]
  )

  const removeSound = useCallback(
    async (sound: SoundData, type: SoundType) => {
      const remove = type === 'sound' ? soundState.removeUserSound : musicState.removeUserSound
      const restore = type === 'sound' ? soundState.addUserSound : musicState.addUserSound

      try {
        remove(sound.id)
        await window.electronAPI.deleteSound({
          sound,
          type,
        })
      } catch (error) {
        restore(sound)
        console.error('Error removing sound:', error)
        throw error
      }
    },
    [soundState, musicState]
  )

  const value = useMemo<SoundsContextType>(
    () => ({
      sounds,
      music,
      addSound,
      removeSound,
      isLoading: soundState.loading || musicState.loading,
    }),
    [sounds, music, addSound, removeSound, soundState.loading, musicState.loading]
  )

  return <SoundsContext.Provider value={value}>{children}</SoundsContext.Provider>
}

export function useSounds(): SoundsContextType {
  const context = useContext(SoundsContext)

  if (!context) {
    throw new Error('useSounds must be used within a SoundsProvider')
  }

  return context
}
