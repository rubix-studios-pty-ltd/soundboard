import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { defaultSettings } from "@/constants/settings"

import type { Settings } from "@/types"

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  isInitialized: boolean
}

const validateSettings = (settings: any): Settings => {
  return {
    ...defaultSettings,
    ...settings,
    hiddenSounds: Array.isArray(settings.hiddenSounds)
      ? settings.hiddenSounds
      : [],
    buttonColors:
      typeof settings.buttonColors === "object" && settings.buttonColors
        ? settings.buttonColors
        : {},
    dragAndDropEnabled:
      typeof settings.dragAndDropEnabled === "boolean"
        ? settings.dragAndDropEnabled
        : defaultSettings.dragAndDropEnabled,
    favorites: {
      ...defaultSettings.favorites,
      ...(typeof settings.favorites === "object" && settings.favorites
        ? settings.favorites
        : {}),
      items: Array.isArray(settings?.favorites?.items)
        ? settings.favorites.items
        : [],
    },
    theme: {
      ...defaultSettings.theme,
      ...(typeof settings.theme === "object" && settings.theme
        ? settings.theme
        : {}),
    },
  }
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  isInitialized: false,
})

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        const savedSettings = await window.electronAPI.loadSettings()
        const validatedSettings = validateSettings(savedSettings)
        setSettings(validatedSettings)
      } catch (error: unknown) {
        console.error("Failed to load settings:", error)
      } finally {
        setIsInitialized(true)
      }
    }
    initializeSettings()
  }, [])

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = validateSettings({
        ...prev,
        ...newSettings,
      })

      Promise.resolve(window.electronAPI.saveSettings(updated)).catch(
        (error: unknown) => {
          console.error("Failed to save settings:", error)
        }
      )

      if ("alwaysOnTop" in newSettings) {
        window.electronAPI.toggleAlwaysOnTop(newSettings.alwaysOnTop ?? false)
      }

      return updated
    })
  }, [])

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, isInitialized }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

export default SettingsContext
