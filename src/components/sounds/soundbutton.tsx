import React, { useEffect, useState } from 'react';
import { useAudio } from '@/context/audiocontext';
import { useSettings } from '@/context/settingcontext';
import { Button } from "@/components/ui/button";

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

    checkPlayingState();

    const interval = setInterval(checkPlayingState, 100);

    return () => clearInterval(interval);
  }, [file, isPlaying, isActive]);

  const { settings } = useSettings();

  const handleClick = async () => {
    if (settings.repeatSoundEnabled) {
      await playSound(id, file);
    } else {
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
    <Button
      variant="outline"
      size="sm"
      className={`h-7 w-24 rounded text-[9px] font-bold items-center justify-center p-1 overflow-hidden ${
        isActive ? 'bg-black text-white hover:bg-gray-900 hover:text-white' : 'hover:bg-accent'
      }`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      data-sound-id={id}
    >
      <span className="truncate w-full text-center">{title}</span>
    </Button>
  );
};

export default SoundButton;
