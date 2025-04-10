import React, { useEffect, useState } from "react"

import type { Settings } from "@/types"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { ThemePicker } from "@/components/ui/theme-picker"
import ToggleSwitch from "@/components/controls/toggles"
import {
  Color,
  Exit,
  Hide,
  Maximize,
  Menu,
  Minimize,
  Multi,
  Mute,
  Repeat,
  StopIcon,
  Volume,
  Windows,
} from "@/components/icons"
import { useAudio } from "@/context/audio"
import { useSettings } from "@/context/setting"
import { presetThemes } from "@/data/themes"

const Header: React.FC = () => {
  const { stopAll } = useAudio()
  const { settings, updateSettings } = useSettings()
  const [previousVolume, setPreviousVolume] = useState(1)

  const handleThemeChange = (themeKey: string | null) => {
    if (themeKey === null) {
      updateSettings({
        theme: {
          ...settings.theme,
          enabled: false,
        },
      })
      return
    }

    const theme = presetThemes[themeKey]
    updateSettings({
      theme: {
        enabled: true,
        ...theme,
      },
    })
  }

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

  const handleMinimize = () => window.electronAPI.minimizeWindow()
  const handleMaximize = () => window.electronAPI.maximizeWindow()
  const handleClose = () => window.electronAPI.closeWindow()

  return (
    <div className="sticky top-0 z-50 flex h-8 items-center justify-between border-b-[1px] border-[#333333] bg-[#1a1a1a]">
      <div className="draggable flex flex-1 flex-row items-center">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-8 w-8 cursor-pointer items-center justify-center transition-colors duration-300 hover:bg-[#333333]">
              <Menu className="h-5 w-5 text-white" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="border-[#333333] bg-[#1a1a1a] p-4 text-white">
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex flex-row items-center gap-1 text-sm font-semibold">
                    <Windows className="h-4 w-4 text-white" /> Giữ trên cùng
                  </div>
                  <p className="text-foreground-muted text-xs">
                    Giữ cửa sổ luôn trên cùng.
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.alwaysOnTop}
                  onChange={(checked) => {
                    const update: Partial<Settings> = { alwaysOnTop: checked }
                    updateSettings(update)
                  }}
                />
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex flex-row items-center gap-1 text-sm font-semibold">
                    <Multi className="h-4 w-4 text-white" /> Phát đồng thời
                  </div>
                  <p className="text-foreground-muted text-xs">
                    Phát nhiều âm thanh cùng lúc.
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.multiSoundEnabled}
                  onChange={(checked) => {
                    const update: Partial<Settings> = {
                      multiSoundEnabled: checked,
                    }
                    updateSettings(update)
                  }}
                />
              </div>
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col items-start gap-1">
                  <div className="flex flex-row items-center gap-1 text-sm font-semibold">
                    <Repeat className="h-4 w-4 text-white" /> Lặp âm thanh
                  </div>
                  <p className="text-foreground-muted text-xs">
                    Phát chồng âm thanh.
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.repeatSoundEnabled}
                  onChange={(checked) => {
                    const update: Partial<Settings> = {
                      repeatSoundEnabled: checked,
                    }
                    updateSettings(update)
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <div className="text-sm">Giao diện</div>
                <ThemePicker onThemeChange={handleThemeChange} />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <div className="draggable px-2 text-xs font-medium text-white">
          Soundboard
        </div>
      </div>

      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                  settings.colorEnabled ? "text-red-500" : "text-white"
                }`}
                onClick={toggleColor}
              >
                <div className="mr-0.5 h-4 w-4">
                  <Color className="h-full w-full" />
                </div>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="border-[#333333] bg-[#1a1a1a] p-4 text-white">
              <span className="text-sm font-semibold">Tùy chỉnh màu nút</span>
              <p className="text-sm">Gán màu riêng cho từng nút.</p>
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                  settings.hideEnabled ? "text-red-500" : "text-white"
                }`}
                onClick={toggleHide}
              >
                <div className="h-4 w-4">
                  <Hide className="h-full w-full" />
                </div>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="border-[#333333] bg-[#1a1a1a] p-4 text-white">
              <span className="text-sm font-semibold">Ẩn nút</span>
              <p className="text-sm">
                Tùy chọn ẩn hoặc hiện từng nút âm thanh.
              </p>
            </HoverCardContent>
          </HoverCard>
          <Separator orientation="vertical" />
          <button
            className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
            onClick={stopAll}
          >
            <div className="h-5.5 w-5.5">
              <StopIcon className="h-full w-full" />
            </div>
          </button>
          <Slider
            value={[settings.volume * 100]}
            onValueChange={(value) => handleVolumeChange(value[0] / 100)}
            max={100}
            step={1}
            className="w-[50px] invert"
          />
          <button
            className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
            onClick={toggleMute}
          >
            <div className="h-4 w-4">
              {settings.volume > 0 ? (
                <Volume className="h-full w-full" />
              ) : (
                <Mute className="h-full w-full" />
              )}
            </div>
          </button>

          <Separator orientation="vertical" />
        </div>

        <div className="no-drag flex">
          <button
            onClick={handleMinimize}
            className="flex h-8 w-8 items-center justify-center text-white transition-colors duration-300 hover:bg-[#333333]"
          >
            <Minimize className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={handleMaximize}
            className="flex h-8 w-8 items-center justify-center text-white transition-colors duration-300 hover:bg-[#333333]"
          >
            <Maximize className="h-3.5 w-3.5 text-white" />
          </button>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center text-white transition-colors duration-300 hover:bg-red-600"
          >
            <Exit className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header
