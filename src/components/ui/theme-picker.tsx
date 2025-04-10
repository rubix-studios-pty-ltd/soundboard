import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Close, Theme } from "@/components/icons"
import { presetThemes } from "@/data/themes"

interface ThemePickerProps {
  onThemeChange: (themeKey: string | null) => void
}

export function ThemePicker({ onThemeChange }: ThemePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="size-4 cursor-pointer">
          <Theme className="h-full w-full" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(presetThemes).map(([key, theme]) => (
            <button
              key={key}
              className="size-6 cursor-pointer rounded-full border transition-transform hover:scale-110"
              style={{ backgroundColor: theme.buttonColor }}
              onClick={() => onThemeChange(key)}
            />
          ))}
          <button
            className="flex size-6 cursor-pointer items-center justify-center rounded-full border bg-white text-black hover:scale-110 hover:bg-gray-100"
            onClick={() => onThemeChange(null)}
          >
            <Close className="size-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
