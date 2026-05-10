import { useCallback, useEffect, useRef, useState } from 'react'

import { type SoundData } from '@/types/sound'
import { generateId } from '@/utils/audio/generateId'

export function useSound(type: 'sound' | 'music') {
  const [userSounds, setUserSounds] = useState<SoundData[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)
  const soundsMapRef = useRef(new Map<string, SoundData>())

  const processSound = useCallback(
    (sound: SoundData): SoundData => ({
      ...sound,
      isUserAdded: true,
      id: sound.id || generateId(sound.file),
      file: sound.file,
    }),
    []
  )

  const soundFile = useCallback(async (sound: SoundData): Promise<boolean> => {
    try {
      await window.electronAPI.validateSound(sound)
      return true
    } catch {
      return false
    }
  }, [])

  const addUserSound = (sound: SoundData) => {
    if (!loadedRef.current) {
      return
    }
    const processedSound = processSound(sound)
    soundsMapRef.current.set(processedSound.id, processedSound)
    setUserSounds((prev) => [...prev, processedSound])
  }

  const removeUserSound = (soundId: string) => {
    if (!loadedRef.current) {
      return
    }
    soundsMapRef.current.delete(soundId)
    setUserSounds((prev) => prev.filter((s) => s.id !== soundId))
  }

  const reloadSounds = async () => {
    try {
      const sounds = await window.electronAPI.loadSounds(type)
      const processedSounds = sounds.map(processSound)

      soundsMapRef.current = new Map(processedSounds.map((sound) => [sound.id, sound]))
      setUserSounds(processedSounds)
      loadedRef.current = true
    } catch {
      soundsMapRef.current = new Map()
      setUserSounds([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadUserSounds = async () => {
      if (loadedRef.current) {
        return
      }

      try {
        setLoading(true)
        const sounds = await window.electronAPI.loadSounds(type)

        const validSounds: SoundData[] = []
        const validSoundsMap = new Map<string, SoundData>()

        for (const sound of sounds) {
          const processedSound = processSound(sound)
          const isValid = await soundFile(processedSound)

          if (isValid) {
            validSounds.push(processedSound)
            validSoundsMap.set(processedSound.id, processedSound)
          }
        }

        soundsMapRef.current = validSoundsMap
        setUserSounds(validSounds)
        loadedRef.current = true
      } catch {
        soundsMapRef.current = new Map()
        setUserSounds([])
      } finally {
        setLoading(false)
      }
    }

    loadUserSounds()
  }, [type, processSound, soundFile])

  return { userSounds, loading, addUserSound, removeUserSound, reloadSounds }
}
