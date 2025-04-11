import React, { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ColorPicker } from "@/components/ui/color-picker"
import { useAudio } from "@/context/audio"
import { useSettings } from "@/context/setting"

interface SoundButtonProps {
  id: string
  file: string
  title: string
  onHotkeyAssign: (soundId: string) => void
  isHideMode?: boolean
  isHidden?: boolean
  onToggleHide?: (id: string) => void
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
  const { playSound, stopSound, isPlaying } = useAudio()
  const [isActive, setIsActive] = useState(false)

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
      await playSound(id, file)
    } else if (isActive) {
      stopSound(file)
    } else {
      await playSound(id, file)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onHotkeyAssign(id)
  }

  return (
    <div className={`relative ${isHidden && !isHideMode ? "hidden" : ""}`}>
      {isHideMode && (
        <Checkbox
          className="absolute top-1.5 right-1 z-10 cursor-pointer border-0 bg-black text-white"
          checked={isHidden}
          onCheckedChange={() => onToggleHide?.(id)}
        />
      )}
      {settings.colorEnabled && (
        <ColorPicker
          onColorChange={(color) =>
            updateSettings({
              buttonColors: {
                ...(settings.buttonColors || {}),
                [id]: color || undefined,
              },
            })
          }
          triggerClassName="absolute left-1 top-1.5 z-10 cursor-pointer"
        />
      )}
      <Button
        variant="outline"
        size="sm"
        className="sound-button h-7 w-24 items-center justify-center overflow-hidden rounded p-1 text-[9px] font-bold transition-all"
        style={
          {
            backgroundColor: settings?.buttonColors?.[id]
              ? isActive
                ? "#000"
                : settings.buttonColors[id]
              : settings?.theme?.enabled
                ? isActive
                  ? settings.theme.buttonActive
                  : settings.theme.buttonColor
                : isActive
                  ? "#000"
                  : undefined,
            color: settings?.buttonColors?.[id]
              ? "#fff"
              : settings?.theme?.enabled
                ? settings.theme.buttonText
                : isActive
                  ? "#fff"
                  : undefined,
            "--button-hover": settings?.buttonColors?.[id]
              ? isActive
                ? "#000"
                : "#404040"
              : settings?.theme?.enabled
                ? isActive
                  ? settings.theme.buttonActive
                  : settings.theme.buttonHoverColor
                : isActive
                  ? "#404040"
                  : "#f3f4f6",
          } as React.CSSProperties
        }
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        data-sound-id={id}
      >
        <span className="w-full truncate text-center">{title}</span>
      </Button>
    </div>
  )
}

export default SoundButton
