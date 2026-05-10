import { useCallback } from 'react'

import { SoundButton } from '@/components/grid/button'
import { HotkeyModal } from '@/components/modals/hotkey'
import { useAudio } from '@/context/audio'
import { useSettings } from '@/context/setting'
import { useSounds } from '@/context/sounds'
import { useHotkey } from '@/hooks/useHotkey'
import { type SoundType } from '@/types/sound'
import { generateId } from '@/utils/audio/generateId'

interface AudioGridProps {
  type: SoundType
  containerId: string
}

export function AudioGrid({ type, containerId }: AudioGridProps) {
  const { settings, updateSettings } = useSettings()
  const { playSound } = useAudio()
  const { sounds, music } = useSounds()

  const audioType = type === 'sound' ? sounds : music

  const mainSet = audioType.filter(
    (audio) =>
      !settings.favorites.items.includes(audio.id) && !settings.popoutGrid.items.includes(audio.id)
  )

  const playAudio = useCallback(
    (audioId: string) => {
      const audio = mainSet.find((a) => a.id === audioId || generateId(a.file) === audioId)

      if (audio) {
        playSound(audio.id, audio.file, audio.isUserAdded || false)
      }
    },
    [mainSet, playSound]
  )

  const { modalOpen, currentHotkey, showHotkeyModal, assignHotkey, clearHotkey, closeModal } =
    useHotkey(mainSet, playAudio)

  const toggleHide = (audioId: string) => {
    const hiddenSounds = settings.hiddenSounds || []

    updateSettings({
      hiddenSounds: hiddenSounds.includes(audioId)
        ? hiddenSounds.filter((id) => id !== audioId)
        : [...hiddenSounds, audioId],
    })
  }

  return (
    <>
      <div id={containerId} className="flex flex-wrap gap-1 p-0">
        {mainSet.map((audio) => (
          <SoundButton
            key={audio.id}
            id={audio.id}
            file={audio.file}
            title={audio.title}
            onHotkeyAssign={showHotkeyModal}
            isHidden={settings.hiddenSounds?.includes(audio.id) || false}
            onToggleHide={toggleHide}
            isDraggable={settings.dragAndDropEnabled}
            isInFavorites={false}
            isInPopout={false}
            isUserAdded={audio.isUserAdded}
            type={type}
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
    </>
  )
}
