import React, { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Chevron, Close } from "@/components/icons"
import { useAudio } from "@/context/audio"
import { useSettings } from "@/context/setting"
import { generateSoundId } from "@/utils/sound-id"

const Preset = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#06b6d4",
]

interface SoundButtonProps {
  id: string
  file: string
  title: string
  onHotkeyAssign: (soundId: string) => void
  isHidden?: boolean
  onToggleHide?: (id: string) => void
  isDraggable?: boolean
  isInFavorites?: boolean
}

const SoundButton: React.FC<SoundButtonProps> = ({
  id,
  file,
  title,
  onHotkeyAssign,
  isHidden = false,
  onToggleHide,
  isDraggable = false,
  isInFavorites = false,
}) => {
  const { playSound, stopSound, isPlaying } = useAudio()
  const [isActive, setIsActive] = useState(false)
  const soundId = id || generateSoundId(file)

  useEffect(() => {
    const checkPlayingState = () => {
      const playing = isPlaying(file)
      if (isActive !== playing) {
        setIsActive(playing)
      }
    }

    checkPlayingState()

    const interval = setInterval(checkPlayingState, 100)

    return () => clearInterval(interval)
  }, [file, isPlaying, isActive])

  const { settings, updateSettings } = useSettings()

  const handleClick = async () => {
    if (settings.repeatSoundEnabled) {
      await playSound(soundId, file)
    } else if (isActive) {
      stopSound(file)
    } else {
      await playSound(soundId, file)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onHotkeyAssign(soundId)
  }

  return (
    <div
      className={`relative ${isHidden && !settings.buttonSettings ? "hidden" : ""}`}
    >
      {settings.buttonSettings && (
        <Popover>
          <PopoverTrigger asChild>
            <Chevron className="absolute top-1.5 right-1 z-10 h-4 w-4 cursor-pointer rounded-full border bg-white text-black transition-all duration-300 hover:text-gray-800" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-w-[200px] border-[#333333] bg-[#1a1a1a] p-4 text-white"
          >
            <div className="flex flex-col gap-4">
              {!isInFavorites && (
                <>
                  <div className="flex flex-row items-center justify-between">
                    <div className="text-sm font-semibold">Ẩn nút</div>
                    <Checkbox
                      className="z-10 cursor-pointer border border-white bg-white text-black focus-visible:ring-0"
                      checked={isHidden}
                      onCheckedChange={() => onToggleHide?.(soundId)}
                    />
                  </div>
                  <Separator />
                </>
              )}
              <div className="grid grid-cols-5 gap-2">
                {Preset.map((presetColor) => (
                  <button
                    key={presetColor}
                    className="size-6 cursor-pointer rounded-full border transition-transform hover:scale-110"
                    style={{ backgroundColor: presetColor }}
                    onClick={() =>
                      updateSettings({
                        buttonColors: {
                          ...(settings.buttonColors || {}),
                          [soundId]: presetColor,
                        },
                      })
                    }
                  />
                ))}
                <button
                  className="flex size-6 cursor-pointer items-center justify-center rounded-full border bg-white text-black hover:scale-110 hover:bg-gray-100"
                  onClick={() =>
                    updateSettings({
                      buttonColors: {
                        ...(settings.buttonColors || {}),
                        [soundId]: undefined,
                      },
                    })
                  }
                >
                  <Close className="size-4" />
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
      <Button
        variant="outline"
        size="sm"
        draggable={isDraggable}
        onDragStart={(e) => {
          if (isDraggable) {
            const soundIdToUse = soundId
            e.dataTransfer.setData("text/sound-id", soundIdToUse)
            e.dataTransfer.effectAllowed = "move"
          }
        }}
        className={`sound-button h-7 w-24 items-center justify-center overflow-hidden rounded p-1 text-[9px] font-bold transition-all ${
          settings.buttonSettings && isHidden ? "opacity-50" : ""
        } ${isDraggable ? "cursor-move" : ""}`}
        style={
          {
            backgroundColor: settings?.buttonColors?.[soundId]
              ? isActive
                ? "#000"
                : settings.buttonColors[soundId]
              : settings?.theme?.enabled
                ? isActive
                  ? settings.theme.buttonActive
                  : settings.theme.buttonColor
                : isActive
                  ? "#000"
                  : undefined,
            color: settings?.buttonColors?.[soundId]
              ? "#fff"
              : settings?.theme?.enabled
                ? settings.theme.buttonText
                : isActive
                  ? "#fff"
                  : undefined,
            "--button-hover": settings?.buttonColors?.[soundId]
              ? isActive
                ? "#000"
                : "#404040"
              : settings?.theme?.enabled
                ? isActive
                  ? settings.theme.buttonActive
                  : settings.theme.buttonHoverColor
                : isActive
                  ? "#404040"
                  : "#e0e0e0",
          } as React.CSSProperties
        }
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        data-sound-id={soundId}
      >
        <span className="w-full truncate text-center">{title}</span>
      </Button>
    </div>
  )
}

export default SoundButton
