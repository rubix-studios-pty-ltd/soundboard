import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react'

import { useSound } from '@/hooks/useSound'
import { type SoundData, type SoundsContextType, type SoundType } from '@/types/sound'
import { generateId } from '@/utils/sound/generateId'
import { getMusic } from '@/utils/sound/getMusic'
import { getSound } from '@/utils/sound/getSound'
import { mergeSounds } from '@/utils/sound/mergeSounds'

const SoundsContext = createContext<SoundsContextType | null>(null)

export function SoundsProvider({ children }: { children: ReactNode }) {
  const regular = useSound('sound')
  const musicState = useSound('music')

  const sounds = useMemo(() => mergeSounds(getSound(), regular.userSounds), [regular.userSounds])

  const music = useMemo(
    () => mergeSounds(getMusic(), musicState.userSounds),
    [musicState.userSounds]
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
        regular.addUserSound(processedSound)
        return
      }

      musicState.addUserSound(processedSound)
    },
    [regular, musicState]
  )

  const removeSound = useCallback(
    async (sound: SoundData, type: SoundType) => {
      const remove = type === 'sound' ? regular.removeUserSound : musicState.removeUserSound
      const restore = type === 'sound' ? regular.addUserSound : musicState.addUserSound

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
    [regular, musicState]
  )

  const value = useMemo<SoundsContextType>(
    () => ({
      sounds,
      music,
      addSound,
      removeSound,
      isLoading: regular.loading || musicState.loading,
    }),
    [sounds, music, addSound, removeSound, regular.loading, musicState.loading]
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
