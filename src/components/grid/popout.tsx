import { type DragEvent, useCallback, useMemo } from 'react'

import { SoundButton } from '@/components/grid/button'
import { Exit } from '@/components/icons'
import { HotkeyModal } from '@/components/modals/hotkey'
import { maxPopout } from '@/constants/settings'
import { useAudio } from '@/context/audio'
import { useSettings } from '@/context/setting'
import { useSounds } from '@/context/sounds'
import { useHotkey } from '@/hooks/useHotkey'
import { generateId } from '@/utils/audio/generateId'

export function AudioGrid() {
  const { settings, updateSettings } = useSettings()
  const { playSound } = useAudio()
  const { sounds, music } = useSounds()

  const { dragAndDropEnabled, popoutGrid } = settings

  const allAudio = useMemo(() => {
    return [...sounds, ...music]
  }, [sounds, music])

  const playAudio = useCallback(
    (audioId: string) => {
      const audio = allAudio.find((a) => a.id === audioId || generateId(a.file) === audioId)

      if (audio) {
        playSound(audio.id, audio.file, audio.isUserAdded || false)
      }
    },
    [allAudio, playSound]
  )

  const { modalOpen, currentHotkey, showHotkeyModal, assignHotkey, clearHotkey, closeModal } =
    useHotkey(allAudio, playAudio)

  const handleDrop = (e: DragEvent<HTMLElement>, slotIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    const soundId = e.dataTransfer.getData('text/sound-id')
    if (!soundId) {
      return
    }
    const newItems = [...popoutGrid.items]
    const existingIndex = newItems.indexOf(soundId)
    if (existingIndex !== -1) {
      newItems.splice(existingIndex, 1)
    }

    newItems.splice(slotIndex, 0, soundId)

    if (newItems.length > popoutGrid.maxItems) {
      newItems.length = popoutGrid.maxItems
    }

    updateSettings({
      popoutGrid: {
        ...popoutGrid,
        items: newItems,
        maxItems: maxPopout,
      },
      favorites: settings.favorites.items.includes(soundId)
        ? {
            ...settings.favorites,
            items: settings.favorites.items.filter((id) => id !== soundId),
          }
        : settings.favorites,
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    if (dragAndDropEnabled) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    if (dragAndDropEnabled) {
      e.preventDefault()
      e.currentTarget.style.borderColor = '#9CA3AF'
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (dragAndDropEnabled) {
      e.preventDefault()
      e.currentTarget.style.borderColor = '#4B5563'
    }
  }

  const removeSound = (audioId: string) => {
    updateSettings({
      popoutGrid: {
        ...popoutGrid,
        items: popoutGrid.items.filter((id) => id !== audioId),
      },
    })
  }

  const usedSlots = popoutGrid.items
    .map((audioId) => {
      const audio = allAudio.find((a) => a.id === audioId || generateId(a.file) === audioId)
      if (audio) {
        return {
          ...audio,
          id: audio.id || generateId(audio.file),
        }
      }
      return null
    })
    .filter(Boolean)

  const slots = dragAndDropEnabled
    ? Array(popoutGrid.maxItems)
        .fill(null)
        .map((_, i) => usedSlots[i] || null)
    : usedSlots

  if (!dragAndDropEnabled && slots.length === 0) {
    return null
  }

  return (
    <>
      <div className="relative z-10 mb-4">
        <ul className="flex flex-wrap gap-1 p-0">
          {slots.map((audio, index) => (
            <li
              key={index}
              aria-label={`Popout audio slot ${index + 1}`}
              className={`relative h-7 w-24 rounded ${
                dragAndDropEnabled ? 'border-2 border-dashed border-gray-600' : ''
              }`}
              onDrop={(e) => handleDrop(e, index)}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              {audio && (
                <div
                  className={`relative ${dragAndDropEnabled ? '-translate-x-0.5 -translate-y-0.75 transform' : ''}`}
                >
                  <SoundButton
                    id={audio.id}
                    file={audio.file}
                    title={audio.title}
                    onHotkeyAssign={showHotkeyModal}
                    isDraggable={dragAndDropEnabled}
                    isInFavorites={false}
                    isInPopout={true}
                    isUserAdded={audio.isUserAdded}
                    type="sound"
                  />
                  {dragAndDropEnabled && (
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600"
                      onClick={() => removeSound(audio.id)}
                    >
                      <Exit className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <HotkeyModal
        isOpen={modalOpen}
        onClose={closeModal}
        onClear={clearHotkey}
        currentHotkey={currentHotkey}
        onAssign={assignHotkey}
      />
    </>
  )
}
