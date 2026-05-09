import { useCallback, useEffect, useState } from 'react'

import type { HotkeyMap, SoundData } from '@/types'

export const useHotkeys = (_soundData: SoundData[], onSoundPlay: (soundId: string) => void) => {
  const [hotkeyMap, setHotkeyMap] = useState<HotkeyMap>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  useEffect(() => {
    const loadHotkeys = async () => {
      try {
        const savedHotkeys = await window.electronAPI.loadHotkeys()
        setHotkeyMap(savedHotkeys)
      } catch (error) {
        console.error('Error loading hotkeys:', error)
        setHotkeyMap({})
      }
    }

    loadHotkeys()
  }, [])

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (modalOpen) {
        return
      }

      const key = event.key.toLowerCase()
      const soundId = Object.entries(hotkeyMap).find(([, hotkey]) => hotkey === key)?.[0]

      if (soundId) {
        onSoundPlay(soundId)
      }
    },
    [hotkeyMap, modalOpen, onSoundPlay]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  const showHotkeyModal = useCallback((soundId: string) => {
    setCurrentId(soundId)
    setModalOpen(true)
  }, [])

  const assignHotkey = useCallback(
    (key: string) => {
      if (!currentId) {
        return
      }

      setHotkeyMap((prev) => {
        const newMap = Object.fromEntries(Object.entries(prev).filter(([, value]) => value !== key))

        newMap[currentId] = key

        window.electronAPI.saveHotkeys(newMap)

        return newMap
      })

      setModalOpen(false)
    },
    [currentId]
  )

  const clearHotkey = useCallback(() => {
    if (!currentId) {
      return
    }

    setHotkeyMap((prev) => {
      const newMap = { ...prev }
      delete newMap[currentId]

      window.electronAPI.saveHotkeys(newMap)

      return newMap
    })

    setModalOpen(false)
  }, [currentId])

  return {
    hotkeyMap,
    modalOpen,
    currentSoundId: currentId,
    currentHotkey: currentId ? hotkeyMap[currentId] : undefined,
    showHotkeyModal,
    assignHotkey,
    clearHotkey,
    closeModal: () => setModalOpen(false),
  }
}
