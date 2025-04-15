import React from "react"

import { Exit } from "@/components/icons"
import SoundButton from "@/components/sounds/button"
import { useSettings } from "@/context/setting"
import { useSounds } from "@/context/sounds"
import { generateSoundId } from "@/utils/sound-id"

const FavoriteGrid: React.FC = () => {
  const { settings, updateSettings } = useSettings()
  const { dragAndDropEnabled, favorites } = settings
  const { sounds, music } = useSounds()
  const allSounds = [...sounds, ...music]

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    slotIndex: number
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const soundId = e.dataTransfer.getData("text/sound-id")
    if (!soundId) {
      return
    }

    const newItems = [...favorites.items]
    const existingIndex = newItems.indexOf(soundId)
    if (existingIndex !== -1) {
      newItems.splice(existingIndex, 1)
    }

    newItems.splice(slotIndex, 0, soundId)

    if (newItems.length > favorites.maxItems) {
      newItems.length = favorites.maxItems
    }

    updateSettings({
      favorites: {
        ...favorites,
        items: newItems,
      },
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragAndDropEnabled) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = "move"
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragAndDropEnabled) {
      e.preventDefault()
      e.currentTarget.style.borderColor = "#9CA3AF"
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragAndDropEnabled) {
      e.preventDefault()
      e.currentTarget.style.borderColor = "#4B5563"
    }
  }

  const removeFavorite = (soundId: string) => {
    updateSettings({
      favorites: {
        ...favorites,
        items: favorites.items.filter((id) => id !== soundId),
      },
    })
  }

  const usedSlots = favorites.items
    .map((soundId) => {
      const sound = allSounds.find(
        (s) => s.id === soundId || generateSoundId(s.file) === soundId
      )
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
    ? Array(favorites.maxItems)
        .fill(null)
        .map((_, i) => usedSlots[i] || null)
    : usedSlots

  if (!dragAndDropEnabled && slots.length === 0) {
    return null
  }

  return (
    <div className="relative z-10 mb-4">
      <div className="flex flex-wrap gap-1 p-0">
        {slots.map((sound, index) => (
          <div
            key={index}
            className={`relative h-7 w-24 rounded ${
              dragAndDropEnabled ? "border-2 border-dashed border-gray-600" : ""
            }`}
            style={{ minHeight: "1.75rem" }}
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            {sound && (
              <div className="relative">
                <SoundButton
                  id={sound.id}
                  file={sound.file}
                  title={sound.title}
                  onHotkeyAssign={() => {}}
                  isDraggable={dragAndDropEnabled}
                  isInFavorites={true}
                  isUserAdded={sound.isUserAdded}
                  type="sound"
                />
                {dragAndDropEnabled && (
                  <button
                    className="absolute -top-1 -right-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600"
                    onClick={() => removeFavorite(sound.id)}
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
  )
}

export default FavoriteGrid
