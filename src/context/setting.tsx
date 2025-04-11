import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import type { Settings } from "@/types"

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  isInitialized: boolean
}

const defaultSettings: Settings = {
  multiSoundEnabled: true,
  repeatSoundEnabled: false,
  alwaysOnTop: false,
  volume: 1,
  maxPoolSize: 100,
  maxInstancesPerSound: 20,
  hideEnabled: false,
  hiddenSounds: [] as string[],
  colorEnabled: false,
  buttonColors: {},
  theme: {
    enabled: false,
    backgroundColor: "#f3f4f6",
    buttonColor: "#4b5563",
    buttonText: "#ffffff",
    buttonActive: "#374151",
    buttonHoverColor: "#404040",
  },
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
