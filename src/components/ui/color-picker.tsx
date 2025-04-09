import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Close } from '@/components/icons';

const Preset = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#eab308',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#06b6d4',
];

interface ColorPickerProps {
  color?: string | null;
  onColorChange: (color: string | null) => void;
  triggerClassName?: string;
}

export function ColorPicker({ color, onColorChange, triggerClassName }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`size-4 rounded-full border ${triggerClassName || ''}`}
          style={{ backgroundColor: color || 'white' }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-4 gap-2">
          {Preset.map((presetColor) => (
            <button
              key={presetColor}
              className="size-6 rounded-full border transition-transform hover:scale-110 cursor-pointer"
              style={{ backgroundColor: presetColor }}
              onClick={() => onColorChange(presetColor)}
            />
          ))}
          <button
            className="size-6 rounded-full border flex items-center justify-center text-black bg-white hover:bg-gray-100 hover:scale-110 cursor-pointer"
            onClick={() => onColorChange(null)}
          >
            <Close className="size-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
