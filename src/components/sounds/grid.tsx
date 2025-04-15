import React, { useCallback } from "react"

import { useHotkeys } from "@/hooks/usehotkey"
import HotkeyModal from "@/components/modals/hotkey"
import SoundButton from "@/components/sounds/button"
import { useAudio } from "@/context/audio"
import { useSettings } from "@/context/setting"
import { useSounds } from "@/context/sounds"
import { generateSoundId } from "@/utils/sound-id"

interface SoundGridProps {
  type: "sound" | "music"
  containerId: string
}

const SoundGrid: React.FC<SoundGridProps> = ({ type, containerId }) => {
  const { settings, updateSettings } = useSettings()
  const { sounds: allSounds, music: allMusic } = useSounds()
  const rawSounds = type === "sound" ? allSounds : allMusic
  const sounds = rawSounds
    .map((sound) => ({
      ...sound,
      id: sound.id ?? generateSoundId(sound.file),
    }))
    .filter((sound) => !settings.favorites.items.includes(sound.id))

  const { playSound } = useAudio()

  const handleSoundPlay = useCallback(
    (soundId: string) => {
      const sound = sounds.find((s) => s.id === soundId)
      if (sound) {
        playSound(sound.id, sound.file)
      }
    },
    [sounds, playSound]
  )

  const {
    modalOpen,
    currentHotkey,
    showHotkeyModal,
    assignHotkey,
    clearHotkey,
    closeModal,
  } = useHotkeys(sounds, handleSoundPlay)

  const handleToggleHide = (soundId: string) => {
    const currentHiddenSounds = settings.hiddenSounds || []
    updateSettings({
      hiddenSounds: currentHiddenSounds.includes(soundId)
        ? currentHiddenSounds.filter((id) => id !== soundId)
        : [...currentHiddenSounds, soundId],
    })
  }

  return (
    <div>
      <div id={containerId} className="flex flex-wrap gap-1 p-0">
        {sounds.map((sound) => (
          <SoundButton
            key={sound.id}
            id={sound.id}
            file={sound.file}
            title={sound.title}
            onHotkeyAssign={showHotkeyModal}
            isHidden={settings.hiddenSounds?.includes(sound.id) || false}
            onToggleHide={handleToggleHide}
            isDraggable={settings.dragAndDropEnabled}
            isInFavorites={false}
          />
        ))}
      </div>
      <HotkeyModal
        isOpen={modalOpen}
        onClose={closeModal}
        onClear={clearHotkey}
        currentHotkey={currentHotkey}
        onAssign={assignHotkey}
      />
    </div>
  )
}

export default SoundGrid
