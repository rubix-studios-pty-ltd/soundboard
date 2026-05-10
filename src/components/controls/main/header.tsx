import { useEffect, useState } from 'react'

import { SettingsControl } from '@/components/controls/settings'
import { WindowsControls } from '@/components/controls/window'
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
} from '@/components/icons'
import { AddSoundModal } from '@/components/modals/sound'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { useAudio } from '@/context/audio'
import { useSettings } from '@/context/setting'
import { useSounds } from '@/context/sounds'
import { type Settings } from '@/types/settings'
import { addAudio } from '@/utils/audio/addAudio'

export function Header() {
  const { settings, updateSettings } = useSettings()
  const { stopAll } = useAudio()
  const { addSound } = useSounds()

  const [preVolume, setPreVolume] = useState(1)
  const [audioModal, setAudioModal] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  const loadAudio = async (type: 'sound' | 'music', file: File, title?: string) => {
    const newSound = await addAudio(file, type, title)
    addSound(newSound, type)
    setAudioModal(false)
  }

  const toggleSettings = () => {
    const update: Partial<Settings> = {
      buttonSettings: !settings.buttonSettings,
    }
    updateSettings(update)
  }

  const changeVolume = (newVolume: number) => {
    if (!Number.isNaN(newVolume) && newVolume >= 0 && newVolume <= 1) {
      const update: Partial<Settings> = { volume: newVolume }
      updateSettings(update)
    }
  }

  const toggleMute = () => {
    if (settings.volume > 0) {
      setPreVolume(settings.volume)
      const update: Partial<Settings> = { volume: 0 }
      updateSettings(update)
    } else {
      const restore = preVolume > 0 ? preVolume : 1
      const update: Partial<Settings> = { volume: restore }
      updateSettings(update)
    }
  }

  const handleTogglePopout = async () => {
    try {
      if (showPopup) {
        window.electronAPI.windowControl('close', 'popout')
      } else {
        window.electronAPI.windowControl('show', 'popout')
      }

      setShowPopup((prevState) => !prevState)
    } catch {
      setShowPopup(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (settings.volume > 0) {
        setPreVolume(settings.volume)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [settings.volume])

  return (
    <div className="sticky top-0 z-50 flex h-7 items-center justify-between border-b border-[#333333] bg-[#1a1a1a]">
      <div className="draggable flex flex-1 flex-row items-center">
        <SettingsControl />

        <div className="draggable px-2 text-xs font-medium text-white">Soundboard</div>
      </div>

      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
              onClick={() => updateSettings({ showSoundGrid: true, showMusicGrid: true })}
            >
              <Library className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                !settings.showMusicGrid ? 'text-red-500' : 'text-white'
              }`}
              onClick={() => updateSettings({ showSoundGrid: true, showMusicGrid: false })}
            >
              <Note className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                !settings.showSoundGrid ? 'text-red-500' : 'text-white'
              }`}
              onClick={() => updateSettings({ showSoundGrid: false, showMusicGrid: true })}
            >
              <Music className="h-3.5 w-3.5" />
            </button>
          </div>
          <Separator orientation="vertical" />
          <button
            type="button"
            className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
            onClick={handleTogglePopout}
          >
            <Popout className="h-3.5 w-3.5" />
          </button>
          <Separator orientation="vertical" />
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                settings.buttonSettings ? 'text-red-500' : 'text-white'
              }`}
              onClick={toggleSettings}
            >
              <Cog className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`cursor-pointer transition-all duration-300 hover:text-red-500 ${
                settings.dragAndDropEnabled ? 'text-red-500' : 'text-white'
              }`}
              onClick={() =>
                updateSettings({
                  dragAndDropEnabled: !settings.dragAndDropEnabled,
                })
              }
            >
              <Drag className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
              onClick={() => setAudioModal(true)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
            onClick={stopAll}
          >
            <StopIcon className="h-5.5 w-5.5" />
          </button>
          <Slider
            value={[settings.volume * 100]}
            onValueChange={(value) => changeVolume(value[0] / 100)}
            max={100}
            step={1}
            className="w-12.5 invert"
          />
          <button
            type="button"
            className="cursor-pointer text-white transition-all duration-300 hover:text-red-500"
            onClick={toggleMute}
          >
            {settings.volume > 0 ? <Volume className="h-4 w-4" /> : <Mute className="h-4 w-4" />}
          </button>
          <Separator orientation="vertical" />
        </div>

        <WindowsControls />
      </div>

      <AddSoundModal isOpen={audioModal} onClose={() => setAudioModal(false)} onAdd={loadAudio} />
    </div>
  )
}
