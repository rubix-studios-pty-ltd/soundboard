import ToggleSwitch from '@/components/controls/toggles'
import { Menu, Multi, Repeat, Windows } from '@/components/icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ThemePicker } from '@/components/ui/theme-picker'
import { presetThemes } from '@/constants/themes'
import { useSettings } from '@/context/setting'
import type { Settings } from '@/types'

export default function SettingsControl() {
  const { settings, updateSettings } = useSettings()

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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-7 w-7 cursor-pointer items-center justify-center transition-colors duration-500 hover:bg-[#333333]"
        >
          <Menu className="h-4 w-4 text-white" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="border-[#333333] bg-[#1a1a1a] p-3 text-white">
        <div className="flex flex-col gap-3">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col items-start gap-1">
              <div className="flex flex-row items-center gap-2 text-sm font-semibold">
                <Windows className="h-4 w-4 text-white" />
                <span>Giữ trên cùng</span>
              </div>
              <p className="text-foreground-muted text-xs">Giữ cửa sổ luôn trên cùng.</p>
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
              <p className="text-foreground-muted text-xs">Phát nhiều âm thanh cùng lúc.</p>
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
              <p className="text-foreground-muted text-xs">Phát chồng âm thanh.</p>
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
  )
}
