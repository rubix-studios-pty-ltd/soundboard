import { useEffect, useState, useRef } from "react"
import type { SoundData } from "@/types"
import { generateSoundId } from "@/utils/sound-id"

export const useUserSounds = (type: "sound" | "music") => {
  const [userSounds, setUserSounds] = useState<SoundData[]>([])
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  useEffect(() => {
    const loadUserSounds = async () => {
      if (loadedRef.current) {
        return
      }

      try {
        const sounds = await window.electronAPI.loadSounds(type)
        const processedSounds = sounds.map((sound) => ({
          ...sound,
          isUserAdded: true,
          id: sound.id || generateSoundId(sound.file),
          file: `${sound.file}`
        }))

        setUserSounds(processedSounds)
        loadedRef.current = true
      } catch (error) {
        console.error(`Error loading user ${type}s:`, error)
      } finally {
        setLoading(false)
      }
    }

    loadUserSounds()
  }, [type])

  const addUserSound = (sound: SoundData) => {
    if (!loadedRef.current) {
      return // Don't add sounds before initial load
    }
    setUserSounds(prev => [...prev, {
      ...sound,
      isUserAdded: true,
      id: sound.id || generateSoundId(sound.file),
      file: `${sound.file}`
    }])
  }

  const reloadSounds = () => {
    loadedRef.current = false
    setLoading(true)
  }

  return { userSounds, loading, addUserSound, reloadSounds }
}
