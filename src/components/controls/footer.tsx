import React from "react"

import { ThemePicker } from "@/components/ui/theme-picker"
import { useSettings } from "@/context/setting"
import { presetThemes } from "@/data/themes"

const Footer: React.FC = () => {
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
    <div className="sticky bottom-0 z-50 flex items-center justify-between border-t border-gray-200 bg-white p-1">
      <p className="p-1 text-[9px]">
        <span className="mr-0.5">&copy;2025</span>
        <a
          href="https://www.rubixstudios.com.au"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-black no-underline hover:no-underline"
        >
          Rubix Studios
        </a>
      </p>
      <div className="flex items-center gap-2">
        <ThemePicker onThemeChange={handleThemeChange} />
      </div>
    </div>
  )
}

export default Footer
