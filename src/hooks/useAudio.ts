import { useCallback, useEffect, useRef, useState } from 'react'

import { type SoundData } from '@/types/sound'
import { generateId } from '@/utils/audio/generateId'

export function useAudio(type: 'sound' | 'music') {
  const [userAudio, setUserAudio] = useState<SoundData[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)
  const audioRef = useRef(new Map<string, SoundData>())

  const processAudio = useCallback(
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

  const addUserAudio = (sound: SoundData) => {
    if (!loadedRef.current) {
      return
    }
    const processedAudio = processAudio(sound)
    audioRef.current.set(processedAudio.id, processedAudio)
    setUserAudio((prev) => [...prev, processedAudio])
  }

  const removeUserAudio = (audioId: string) => {
    if (!loadedRef.current) {
      return
    }
    audioRef.current.delete(audioId)
    setUserAudio((prev) => prev.filter((s) => s.id !== audioId))
  }

  const reloadSounds = async () => {
    try {
      const audio = await window.electronAPI.loadSounds(type)
      const processedSounds = audio.map(processAudio)

      audioRef.current = new Map(processedSounds.map((sound) => [sound.id, sound]))
      setUserAudio(processedSounds)
      loadedRef.current = true
    } catch {
      audioRef.current = new Map()
      setUserAudio([])
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
        const audio = await window.electronAPI.loadSounds(type)

        const validAudio: SoundData[] = []
        const validAudioMap = new Map<string, SoundData>()

        for (const sound of audio) {
          const processedAudio = processAudio(sound)
          const isValid = await soundFile(processedAudio)

          if (isValid) {
            validAudio.push(processedAudio)
            validAudioMap.set(processedAudio.id, processedAudio)
          }
        }

        audioRef.current = validAudioMap
        setUserAudio(validAudio)
        loadedRef.current = true
      } catch {
        audioRef.current = new Map()
        setUserAudio([])
      } finally {
        setLoading(false)
      }
    }

    loadUserSounds()
  }, [type, processAudio, soundFile])

  return { userAudio, loading, addUserAudio, removeUserAudio, reloadSounds }
}
