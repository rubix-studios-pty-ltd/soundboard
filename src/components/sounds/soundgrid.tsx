import React, { useCallback } from 'react';
import { SoundData } from '@/types';
import { useHotkeys } from '@/hooks/usehotkey';
import SoundButton from '@/components/sounds/soundbutton';
import HotkeyModal from '@/components/modals/hotkeymodal';
import { useAudio } from '@/context/audiocontext';

interface SoundGridProps {
  sounds: SoundData[];
  containerId: string;
}

const SoundGrid: React.FC<SoundGridProps> = ({ sounds, containerId }) => {
  const { playSound } = useAudio();

  const handleSoundPlay = useCallback((soundId: string) => {
    const sound = sounds.find(s => s.id === soundId);
    if (sound) {
      playSound(sound.id, sound.file);
    }
  }, [sounds, playSound]);

  const {
    modalOpen,
    currentHotkey,
    showHotkeyModal,
    assignHotkey,
    clearHotkey,
    closeModal
  } = useHotkeys(sounds, handleSoundPlay);

  return (
    <div id={containerId} className="flex flex-wrap gap-1 p-0">
      {sounds.map(sound => (
        <SoundButton
          key={sound.id}
          id={sound.id}
          file={sound.file}
          title={sound.title}
          onHotkeyAssign={showHotkeyModal}
        />
      ))}
      <HotkeyModal
        isOpen={modalOpen}
        onClose={closeModal}
        onClear={clearHotkey}
        currentHotkey={currentHotkey}
        onAssign={assignHotkey}
      />
    </div>
  );
};

export default SoundGrid;
