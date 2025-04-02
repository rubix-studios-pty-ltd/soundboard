import React, { useState, useEffect } from 'react';
import { useAudio } from '@/context/audiocontext';
import { useSettings } from '@/context/settingcontext';
import ToggleSwitch from '@/components/controls/toggleswitch';
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"

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
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 20 20"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className={settings.volume > 0 ? "w-full h-full" : "w-full h-full hidden"}
            >
              <path d="M10.5 3.75a.75.75 0 0 0-1.264-.546L5.203 7H2.667a.75.75 0 0 0-.7.48A6.985 6.985 0 0 0 1.5 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h2.535l4.033 3.796a.75.75 0 0 0 1.264-.546V3.75ZM16.45 5.05a.75.75 0 0 0-1.06 1.061 5.5 5.5 0 0 1 0 7.778.75.75 0 0 0 1.06 1.06 7 7 0 0 0 0-9.899Z"></path>
              <path d="M14.329 7.172a.75.75 0 0 0-1.061 1.06 2.5 2.5 0 0 1 0 3.536.75.75 0 0 0 1.06 1.06 4 4 0 0 0 0-5.656Z"></path>
            </svg>
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 20 20"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className={settings.volume === 0 ? "w-full h-full" : "w-full h-full hidden"}
            >
              <path d="M10.047 3.062a.75.75 0 0 1 .453.688v12.5a.75.75 0 0 1-1.264.546L5.203 13H2.667a.75.75 0 0 1-.7-.48A6.985 6.985 0 0 1 1.5 10c0-.887.165-1.737.468-2.52a.75.75 0 0 1 .7-.48h2.535l4.033-3.796a.75.75 0 0 1 .811-.142ZM13.78 7.22a.75.75 0 1 0-1.06 1.06L14.44 10l-1.72 1.72a.75.75 0 0 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L16.56 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L15.5 8.94l-1.72-1.72Z"></path>
            </svg>
          </div>
        </button>
        <button
          className="cursor-pointer text-black hover:text-red-500 transition-all duration-500"
          onClick={stopAll}
        >
          <div className="w-6 h-6">
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path d="M16 6h-8c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2z"></path>
            </svg>
          </div>
        </button>

        <Separator orientation="vertical" />

        <div className="flex gap-3">
          <ToggleSwitch
            checked={settings.alwaysOnTop}
            onChange={(checked) => updateSettings({ alwaysOnTop: checked })}
            icon={
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <path d="M11 5h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2v-4"></path>
                <path d="M15 10h5a1 1 0 0 0 1 -1v-3a1 1 0 0 0 -1 -1h-5a1 1 0 0 0 -1 1v3a1 1 0 0 0 1 1z"></path>
              </svg>
            }
            title="Luôn hiển thị trên cùng"
            text="Giữ cửa sổ này luôn nằm trên các cửa sổ khác."
          />
          <ToggleSwitch
            checked={settings.multiSoundEnabled}
            onChange={(checked) => updateSettings({ multiSoundEnabled: checked })}
            icon={
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <path d="M8.75 11.5h11.5a.75.75 0 0 1 0 1.5H8.75a.75.75 0 0 1 0-1.5Zm0 6h11.5a.75.75 0 0 1 0 1.5H8.75a.75.75 0 0 1 0-1.5Zm-5-12h10a.75.75 0 0 1 0 1.5h-10a.75.75 0 0 1 0-1.5ZM5 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM19.309 7.918l-2.245-2.501A.25.25 0 0 1 17.25 5h4.49a.25.25 0 0 1 .185.417l-2.244 2.5a.25.25 0 0 1-.372 0Z" />
              </svg>
            }
            title="Phát nhiều âm thanh"
            text="Cho phép phát nhiều hiệu ứng âm thanh cùng lúc."
          />
          <ToggleSwitch
            checked={settings.repeatSoundEnabled}
            onChange={(checked) => updateSettings({ repeatSoundEnabled: checked })}
            icon={
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 512 512"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <path d="M336.6 157.5L303 124.1c-3.5-3.5-8.5-4.9-13.6-3.6-1.2.3-2.4.8-3.5 1.5-4.7 2.9-7.2 7.8-6.8 13.1.2 3.4 1.9 6.6 4.3 9.1l16 15.9H142c-20.8 0-40.3 8.1-55.1 22.9C72.1 197.7 64 217.2 64 238v16c0 7.7 6.3 14 14 14s14-6.3 14-14v-16c0-13.3 5.2-25.8 14.7-35.3 9.5-9.5 22-14.7 35.3-14.7h155.4l-16 15.9c-2.4 2.4-4 5.4-4.3 8.7-.4 4.2 1.1 8.3 4.1 11.3 2.6 2.6 6.2 4.1 9.9 4.1s7.2-1.4 9.9-4.1l35.6-35.4c4.2-4.1 6.5-9.7 6.5-15.5-.1-5.9-2.4-11.4-6.5-15.5zM434 244c-7.7 0-14 6.3-14 14v16c0 13.3-5.2 25.8-14.7 35.3-9.5 9.5-22 14.7-35.3 14.7H214.6l16-15.9c2.4-2.4 4-5.4 4.3-8.8.4-4.2-1.1-8.3-4.1-11.3-2.6-2.6-6.2-4.1-9.9-4.1s-7.2 1.4-9.9 4.1l-35.6 35.4c-4.2 4.1-6.5 9.7-6.5 15.5 0 5.9 2.3 11.4 6.5 15.5l33.6 33.4c3.5 3.5 8.5 4.9 13.6 3.6 1.2-.3 2.4-.8 3.5-1.5 4.7-2.9 7.2-7.8 6.8-13.1-.2-3.4-1.9-6.6-4.3-9.1l-16-15.9H370c43 0 78-35 78-78v-16c0-7.5-6.3-13.8-14-13.8z" />
              </svg>
            }
            title="Lặp âm thanh"
            text="Cho phép âm thanh phát chồng lên khi nhấn nhiều lần."
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
