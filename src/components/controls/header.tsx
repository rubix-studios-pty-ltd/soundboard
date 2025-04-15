import React, { useEffect, useState } from "react"

import type { Settings } from "@/types"
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
  Cog,
  Drag,
  Exit,
  Maximize,
  Menu,
  Minimize,
  Multi,
  Mute,
  Plus,
  Repeat,
  StopIcon,
  Volume,
  Windows,
} from "@/components/icons"
import AddSoundModal from "@/components/modals/add-sound"
import { useAudio } from "@/context/audio"
import { useSettings } from "@/context/setting"
import { useSounds } from "@/context/sounds"
import { addNewSound } from "@/utils/audio-convert"
import { presetThemes } from "@/data/themes"

const Header: React.FC = () => {
  const { stopAll } = useAudio()
  const { settings, updateSettings } = useSettings()
  const { addSound } = useSounds()
  const [previousVolume, setPreviousVolume] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleAddSound = async (type: "sound" | "music", file: File) => {
    const newSound = await addNewSound(file, type)
    addSound(newSound, type)
    setIsAddModalOpen(false)
  }

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

  const buttonSettings = () => {
    const update: Partial<Settings> = {
      buttonSettings: !settings.buttonSettings,
    }
    updateSettings(update)
  }

  const handleVolumeChange = (newVolume: number) => {
    if (!isNaN(newVolume) && newVolume >= 0 && newVolume <= 1) {
      const update: Partial<Settings> = { volume: newVolume }
      updateSettings(update)
    }
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
                  <div className="flex flex-row items-center gap-2 text-sm font-semibold">
                    <Windows className="h-4 w-4 text-white" />
                    <span>Giữ trên cùng</span>
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
                  <div className="flex flex-row items-center gap-2 text-sm font-semibold">
                    <Multi className="h-4 w-4 text-white" />
                    <span>Phát đồng thời</span>
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
                  <div className="flex flex-row items-center gap-2 text-sm font-semibold">
                    <Repeat className="h-4 w-4 text-white" />
                    <span>Lặp âm thanh</span>
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
              <div className="flex gap-2">
                <div className="text-sm font-semibold">Giao diện</div>
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
          <div className="flex items-center gap-2.5">
            <button
              className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                settings.buttonSettings ? "text-red-500" : "text-white"
              }`}
              onClick={buttonSettings}
            >
              <div className="h-4 w-4">
                <Cog className="h-full w-full" />
              </div>
            </button>
            <button
              className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                settings.dragAndDropEnabled ? "text-red-500" : "text-white"
              }`}
              onClick={() =>
                updateSettings({
                  dragAndDropEnabled: !settings.dragAndDropEnabled,
                })
              }
            >
              <div className="h-4 w-4">
                <Drag className="h-full w-full" />
              </div>
            </button>
            <button
              className="cursor-pointer text-white transition-all duration-300 hover:text-red-500 hidden"
              onClick={() => setIsAddModalOpen(true)}
            >
              <div className="h-4 w-4">
                <Plus className="h-full w-full" />
              </div>
            </button>
          </div>
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

      <AddSoundModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSound}
      />
    </div>
  )
}

export default Header
