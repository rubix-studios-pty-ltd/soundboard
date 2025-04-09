import React, { useEffect, useState } from 'react';
import { useAudio } from '@/context/audio';
import { useSettings } from '@/context/setting';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";

interface SoundButtonProps {
  id: string;
  file: string;
  title: string;
  onHotkeyAssign: (soundId: string) => void;
  isHideMode?: boolean;
  isHidden?: boolean;
  onToggleHide?: (id: string) => void;
}

const SoundButton: React.FC<SoundButtonProps> = ({
  id,
  file,
  title,
  onHotkeyAssign,
  isHideMode = false,
  isHidden = false,
  onToggleHide,
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

  const { settings, updateSettings } = useSettings();

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
    <div className={`relative ${isHidden && !isHideMode ? 'hidden' : ''}`}>
      {isHideMode && (
        <Checkbox
          className="absolute right-1 top-1.5 z-10"
          checked={isHidden}
          onCheckedChange={() => onToggleHide?.(id)}
        />
      )}
      {settings.colorEnabled && (
        <ColorPicker
          color={settings.buttonColors?.[id]}
          onColorChange={(color) => 
            updateSettings({
              buttonColors: {
                ...(settings.buttonColors || {}),
                [id]: color || undefined
              }
            })
          }
          triggerClassName="absolute left-1 top-1.5 z-10"
        />
      )}
      <Button
        variant="outline"
        size="sm"
        className={`h-7 w-24 rounded text-[9px] font-bold items-center justify-center p-1 overflow-hidden transition-colors ${
          isActive ? 'bg-black text-white hover:bg-gray-900 hover:text-white' 
          : 'hover:bg-accent'
        }`}
        style={settings.buttonColors?.[id] ? { 
          backgroundColor: settings.buttonColors[id],
          '--tw-hover-opacity': '0.9'
        } as React.CSSProperties : undefined}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        data-sound-id={id}
      >
        <span className="truncate w-full text-center">{title}</span>
      </Button>
    </div>
  );
};

export default SoundButton;
