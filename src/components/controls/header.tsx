import React, { useState, useEffect } from 'react';
import { useAudio } from '@/context/audio';
import { useSettings } from '@/context/setting';
import ToggleSwitch from '@/components/controls/toggles';
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Volume,
  Mute,
  StopIcon,
  Windows,
  Multi,
  Repeat
} from '@/components/icons';

const Header: React.FC = () => {
  const { stopAll } = useAudio();
  const { settings, updateSettings } = useSettings();
  const [previousVolume, setPreviousVolume] = useState(1);

  const handleVolumeChange = (newVolume: number) => {
    if (!isNaN(newVolume) && newVolume >= 0 && newVolume <= 1) {
      updateSettings({ volume: newVolume });
    }
  };

  const toggleMute = () => {
    if (settings.volume > 0) {
      setPreviousVolume(settings.volume);
      updateSettings({ volume: 0 });
    } else {
      const volumeToRestore = previousVolume > 0 ? previousVolume : 1;
      updateSettings({ volume: volumeToRestore });
    }
  };

  useEffect(() => {
    if (settings.volume > 0) {
      setPreviousVolume(settings.volume);
    }
  }, []);

  return (
    <div className="bg-white flex items-center justify-between p-1 sticky top-0 z-50">
      <div className="text-base font-bold mx-2">Soundboard</div>
      <div className="flex items-center gap-2">
        <Slider
          value={[settings.volume * 100]}
          onValueChange={(value) => handleVolumeChange(value[0] / 100)}
          max={100}
          step={1}
          className="w-[70px] mr-1.5"
        />
        <button
          className="cursor-pointer text-black hover:text-red-500 transition-all duration-500"
          onClick={toggleMute}
        >
          <div className="w-5 h-5">
            {settings.volume > 0 ? (
              <Volume className="w-full h-full" />
            ) : (
              <Mute className="w-full h-full" />
            )}
          </div>
        </button>
        <button
          className="cursor-pointer text-black hover:text-red-500 transition-all duration-500"
          onClick={stopAll}
        >
          <div className="w-6 h-6">
            <StopIcon className="w-full h-full" />
          </div>
        </button>

        <Separator orientation="vertical" />

        <div className="flex gap-3">
          <ToggleSwitch
            checked={settings.alwaysOnTop}
            onChange={(checked) => updateSettings({ alwaysOnTop: checked })}
            icon={<Windows className="w-full h-full" />}
            title="Luôn hiển thị trên cùng"
            text="Giữ cửa sổ này luôn nằm trên các cửa sổ khác."
          />
          <ToggleSwitch
            checked={settings.multiSoundEnabled}
            onChange={(checked) => updateSettings({ multiSoundEnabled: checked })}
            icon={<Multi className="w-full h-full" />}
            title="Phát nhiều âm thanh"
            text="Cho phép phát nhiều hiệu ứng âm thanh cùng lúc."
          />
          <ToggleSwitch
            checked={settings.repeatSoundEnabled}
            onChange={(checked) => updateSettings({ repeatSoundEnabled: checked })}
            icon={<Repeat className="w-full h-full" />}
            title="Lặp âm thanh"
            text="Cho phép âm thanh phát chồng lên khi nhấn nhiều lần."
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
