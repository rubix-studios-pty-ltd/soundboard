import React, { useEffect, useState } from "react"

import type { Settings } from "@/types"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import ToggleSwitch from "@/components/controls/toggles"
import {
  Color,
  Hide,
  Multi,
  Mute,
  Repeat,
  StopIcon,
  Volume,
  Windows,
} from "@/components/icons"
import { useAudio } from "@/context/audio"
import { useSettings } from "@/context/setting"

const Header: React.FC = () => {
  const { stopAll } = useAudio()
  const { settings, updateSettings } = useSettings()
  const [previousVolume, setPreviousVolume] = useState(1)

  const toggleColor = () => {
    const update: Partial<Settings> = { colorEnabled: !settings.colorEnabled }
    updateSettings(update)
  }

  const handleVolumeChange = (newVolume: number) => {
    if (!isNaN(newVolume) && newVolume >= 0 && newVolume <= 1) {
      const update: Partial<Settings> = { volume: newVolume }
      updateSettings(update)
    }
  }

  const toggleHide = () => {
    const update: Partial<Settings> = { hideEnabled: !settings.hideEnabled }
    updateSettings(update)
  }

  const toggleMute = () => {
    if (settings.volume > 0) {
      setPreviousVolume(settings.volume)
      const update: Partial<Settings> = { volume: 0 }
      updateSettings(update)
    } else {
      const volumeToRestore = previousVolume > 0 ? previousVolume : 1
      const update: Partial<Settings> = { volume: volumeToRestore }
      updateSettings(update)
    }
  }

  useEffect(() => {
    if (settings.volume > 0) {
      setPreviousVolume(settings.volume)
    }
  }, [])

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between bg-white p-1">
      <div className="mx-2 text-base font-bold">Soundboard</div>

      <div className="flex items-center gap-2">
        <button
          className={`cursor-pointer text-black transition-all duration-500 hover:text-red-500 ${
            settings.colorEnabled ? "text-red-500" : ""
          }`}
          onClick={toggleColor}
        >
          <div className="h-5 w-5">
            <Color className="h-full w-full" />
          </div>
        </button>
        <button
          className={`cursor-pointer text-black transition-all duration-500 hover:text-red-500 ${
            settings.hideEnabled ? "text-red-500" : ""
          }`}
          onClick={toggleHide}
        >
          <div className="h-5 w-5">
            <Hide className="h-full w-full" />
          </div>
        </button>
        <Slider
          value={[settings.volume * 100]}
          onValueChange={(value) => handleVolumeChange(value[0] / 100)}
          max={100}
          step={1}
          className="mr-1.5 w-[70px]"
        />
        <button
          className="cursor-pointer text-black transition-all duration-500 hover:text-red-500"
          onClick={toggleMute}
        >
          <div className="h-5 w-5">
            {settings.volume > 0 ? (
              <Volume className="h-full w-full" />
            ) : (
              <Mute className="h-full w-full" />
            )}
          </div>
        </button>
        <button
          className="cursor-pointer text-black transition-all duration-500 hover:text-red-500"
          onClick={stopAll}
        >
          <div className="h-6 w-6">
            <StopIcon className="h-full w-full" />
          </div>
        </button>

        <Separator orientation="vertical" />

        <div className="flex gap-3">
          <ToggleSwitch
            checked={settings.alwaysOnTop}
            onChange={(checked) => {
              const update: Partial<Settings> = { alwaysOnTop: checked }
              updateSettings(update)
            }}
            icon={<Windows className="h-full w-full" />}
            title="Luôn hiển thị trên cùng"
            text="Giữ cửa sổ này luôn nằm trên các cửa sổ khác."
          />
          <ToggleSwitch
            checked={settings.multiSoundEnabled}
            onChange={(checked) => {
              const update: Partial<Settings> = { multiSoundEnabled: checked }
              updateSettings(update)
            }}
            icon={<Multi className="h-full w-full" />}
            title="Phát nhiều âm thanh"
            text="Cho phép phát nhiều hiệu ứng âm thanh cùng lúc."
          />
          <ToggleSwitch
            checked={settings.repeatSoundEnabled}
            onChange={(checked) => {
              const update: Partial<Settings> = { repeatSoundEnabled: checked }
              updateSettings(update)
            }}
            icon={<Repeat className="h-full w-full" />}
            title="Lặp âm thanh"
            text="Cho phép âm thanh phát chồng lên khi nhấn nhiều lần."
          />
        </div>
      </div>
    </div>
  )
}

export default Header
