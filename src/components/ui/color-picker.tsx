import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Close } from "@/components/icons"

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

interface ColorPickerProps {
  onColorChange: (color: string | null) => void
  triggerClassName?: string
}

export function ColorPicker({
  onColorChange,
  triggerClassName,
}: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName || ""}`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-4 gap-2">
          {Preset.map((presetColor) => (
            <button
              key={presetColor}
              className="size-6 cursor-pointer rounded-full border transition-transform hover:scale-110"
              style={{ backgroundColor: presetColor }}
              onClick={() => onColorChange(presetColor)}
            />
          ))}
          <button
            className="flex size-6 cursor-pointer items-center justify-center rounded-full border bg-white text-black hover:scale-110 hover:bg-gray-100"
            onClick={() => onColorChange(null)}
          >
            <Close className="size-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
