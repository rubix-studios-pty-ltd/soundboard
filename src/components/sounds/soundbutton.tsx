import React, { useEffect, useState } from 'react';
import { useAudio } from '@/context/audiocontext';
import { useSettings } from '@/context/settingcontext';

interface SoundButtonProps {
  id: string;
  file: string;
  title: string;
  onHotkeyAssign: (soundId: string) => void;
}

const SoundButton: React.FC<SoundButtonProps> = ({
  id,
  file,
  title,
  onHotkeyAssign,
}) => {
  const { playSound, stopSound, isPlaying } = useAudio();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const checkPlayingState = () => {
      const playing = isPlaying(file);
      if (isActive !== playing) {
        setIsActive(playing);
      }
    };

    // Check initial state
    checkPlayingState();

    // Create interval to check state
    const interval = setInterval(checkPlayingState, 100);

    return () => clearInterval(interval);
  }, [file, isPlaying, isActive]);

  const { settings } = useSettings();

  const handleClick = async () => {
    // In repeat mode, always play a new instance
    if (settings.repeatSoundEnabled) {
      await playSound(id, file);
    } else {
      // Normal toggle behavior when repeat is disabled
      if (isActive) {
        stopSound(file);
      } else {
        await playSound(id, file);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onHotkeyAssign(id);
  };

  return (
    <button
      className={`sound-button bg-white text-[9px] font-bold border rounded px-0.5 py-1.5 cursor-pointer flex flex-col items-center w-24 overflow-hidden ${
        isActive ? 'active' : ''
      }`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      data-sound-id={id}
    >
      <span className="title">{title}</span>
    </button>
  );
};

export default SoundButton;
