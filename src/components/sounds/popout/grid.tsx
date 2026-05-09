import { type DragEvent, useCallback } from 'react'
import { Exit } from '@/components/icons'
import { HotkeyModal } from '@/components/modals/hotkey'
import { SoundButton } from '@/components/sounds/button'
import { useAudio } from '@/context/audio'
import { useSettings } from '@/context/setting'
import { useSounds } from '@/context/sounds'
import { useHotkeys } from '@/hooks/usehotkey'
import { generateSoundId } from '@/utils/sound/id'

export function SoundGrid() {
  const { settings, updateSettings } = useSettings()
  const { dragAndDropEnabled, popoutGrid } = settings
  const { sounds, music } = useSounds()
  const { playSound } = useAudio()
  const allSounds = [...sounds, ...music]

  const handleSoundPlay = useCallback(
    (soundId: string) => {
      const sound = allSounds.find((s) => s.id === soundId || generateSoundId(s.file) === soundId)
      if (sound) {
        playSound(sound.id, sound.file, sound.isUserAdded || false)
      }
    },
    // biome-ignore lint:correctness/useExhaustiveDependencies: ignore
    [allSounds, playSound]
  )

  const { modalOpen, currentHotkey, showHotkeyModal, assignHotkey, clearHotkey, closeModal } =
    useHotkeys(allSounds, handleSoundPlay)

  const handleDrop = (e: DragEvent<HTMLDivElement>, slotIndex: number) => {
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
        maxItems: 42,
      },
      favorites: settings.favorites.items.includes(soundId)
        ? {
            ...settings.favorites,
            items: settings.favorites.items.filter((id) => id !== soundId),
          }
        : settings.favorites,
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragAndDropEnabled) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragAndDropEnabled) {
      e.preventDefault()
      e.currentTarget.style.borderColor = '#9CA3AF'
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragAndDropEnabled) {
      e.preventDefault()
      e.currentTarget.style.borderColor = '#4B5563'
    }
  }

  const removeSound = (soundId: string) => {
    updateSettings({
      popoutGrid: {
        ...popoutGrid,
        items: popoutGrid.items.filter((id) => id !== soundId),
      },
    })
  }

  const usedSlots = popoutGrid.items
    .map((soundId) => {
      const sound = allSounds.find((s) => s.id === soundId || generateSoundId(s.file) === soundId)
      if (sound) {
        return {
          ...sound,
          id: sound.id || generateSoundId(sound.file),
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
        <div className="flex flex-wrap gap-1 p-0">
          {slots.map((sound, index) => (
            /* biome-ignore lint/a11y/noStaticElementInteractions: not required here */
            <div
              key={index}
              className={`relative h-7 w-24 rounded ${
                dragAndDropEnabled ? 'border-2 border-dashed border-gray-600' : ''
              }`}
              onDrop={(e) => handleDrop(e, index)}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              {sound && (
                <div
                  className={`relative ${dragAndDropEnabled ? '-translate-x-0.5 -translate-y-0.75 transform' : ''}`}
                >
                  <SoundButton
                    id={sound.id}
                    file={sound.file}
                    title={sound.title}
                    onHotkeyAssign={showHotkeyModal}
                    isDraggable={dragAndDropEnabled}
                    isInFavorites={false}
                    isInPopout={true}
                    isUserAdded={sound.isUserAdded}
                    type="sound"
                  />
                  {dragAndDropEnabled && (
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600"
                      onClick={() => removeSound(sound.id)}
                    >
                      <Exit className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
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
