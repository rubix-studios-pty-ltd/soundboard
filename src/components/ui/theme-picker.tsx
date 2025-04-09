import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Close } from '@/components/icons';
import { presetThemes } from '@/data/themes';
import { Theme } from '@/components/icons';

interface ThemePickerProps {
  onThemeChange: (themeKey: string | null) => void;
}

export function ThemePicker({ onThemeChange }: ThemePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="size-4 cursor-pointer">
            <Theme className="w-full h-full" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(presetThemes).map(([key, theme]) => (
            <button
              key={key}
              className="size-6 rounded-full border transition-transform hover:scale-110 cursor-pointer"
              style={{ backgroundColor: theme.buttonColor }}
              onClick={() => onThemeChange(key)}
            />
          ))}
          <button
            className="size-6 rounded-full border flex items-center justify-center text-black bg-white hover:bg-gray-100 hover:scale-110 cursor-pointer"
            onClick={() => onThemeChange(null)}
          >
            <Close className="size-4" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
