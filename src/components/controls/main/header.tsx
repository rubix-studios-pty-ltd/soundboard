import React, { useEffect, useState } from "react"

import type { Settings } from "@/types"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import SettingsControl from "@/components/controls/settings"
import WindowsControls from "@/components/controls/window"
import {
  Cog,
  Drag,
  Library,
  Music,
  Mute,
  Note,
  Plus,
  Popout,
  StopIcon,
  Volume,
} from "@/components/icons"
import AddSoundModal from "@/components/modals/sound"
import { useAudio } from "@/context/audio"
import { useSettings } from "@/context/setting"
import { useSounds } from "@/context/sounds"
import { addNewSound } from "@/utils/audio/convert"

const Header: React.FC = () => {
  const { stopAll } = useAudio()
  const { settings, updateSettings } = useSettings()
  const { addSound } = useSounds()
  const [previousVolume, setPreviousVolume] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [popoutVisible, setPopoutVisible] = useState(false)

  const handleAddSound = async (
    type: "sound" | "music",
    file: File,
    title?: string
  ) => {
    const newSound = await addNewSound(file, type, title)
    addSound(newSound, type)
    setIsAddModalOpen(false)
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

  const handleTogglePopout = async () => {
    try {
      if (popoutVisible) {
        window.electronAPI.windowControl("close", "popout")
      } else {
        window.electronAPI.windowControl("show", "popout")
      }

      setPopoutVisible((prevState) => !prevState)
    } catch {
      setPopoutVisible(false)
    }
  }

  useEffect(() => {
    if (settings.volume > 0) {
      setPreviousVolume(settings.volume)
    }
  }, [])

  return (
    <div className="sticky top-0 z-50 flex h-7 items-center justify-between border-b-[1px] border-[#333333] bg-[#1a1a1a]">
      <div className="draggable flex flex-1 flex-row items-center">
        <SettingsControl />

        <div className="draggable px-2 text-xs font-medium text-white">
          Soundboard
        </div>
      </div>

      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5">
            <button
              className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
              onClick={() =>
                updateSettings({ showSoundGrid: true, showMusicGrid: true })
              }
            >
              <div className="h-3.5 w-3.5">
                <Library className="h-full w-full" />
              </div>
            </button>
            <button
              className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                !settings.showMusicGrid ? "text-red-500" : "text-white"
              }`}
              onClick={() =>
                updateSettings({ showSoundGrid: true, showMusicGrid: false })
              }
            >
              <div className="h-3.5 w-3.5">
                <Note className="h-full w-full" />
              </div>
            </button>
            <button
              className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                !settings.showSoundGrid ? "text-red-500" : "text-white"
              }`}
              onClick={() =>
                updateSettings({ showSoundGrid: false, showMusicGrid: true })
              }
            >
              <div className="h-3.5 w-3.5">
                <Music className="h-full w-full" />
              </div>
            </button>
          </div>
          <Separator orientation="vertical" />
          <button
            className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
            onClick={handleTogglePopout}
          >
            <div className="h-3.5 w-3.5">
              <Popout className="h-full w-full" />
            </div>
          </button>
          <Separator orientation="vertical" />
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
              className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
              onClick={() => setIsAddModalOpen(true)}
            >
              <div className="h-4 w-4">
                <Plus className="h-full w-full" />
              </div>
            </button>
          </div>
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

        <WindowsControls />
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
