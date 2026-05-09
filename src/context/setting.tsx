import type React from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { defaultSettings } from '@/constants/settings'

import type { Settings } from '@/types/settings'

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  isInitialized: boolean
}

const validateSettings = (settings: any): Settings => {
  return {
    ...defaultSettings,
    ...settings,
    hiddenSounds: Array.isArray(settings.hiddenSounds) ? settings.hiddenSounds : [],
    buttonColors:
      typeof settings.buttonColors === 'object' && settings.buttonColors
        ? settings.buttonColors
        : {},
    dragAndDropEnabled:
      typeof settings.dragAndDropEnabled === 'boolean'
        ? settings.dragAndDropEnabled
        : defaultSettings.dragAndDropEnabled,
    favorites: {
      ...defaultSettings.favorites,
      ...(typeof settings.favorites === 'object' && settings.favorites ? settings.favorites : {}),
      items: Array.isArray(settings?.favorites?.items) ? settings.favorites.items : [],
    },
    theme: {
      ...defaultSettings.theme,
      ...(typeof settings.theme === 'object' && settings.theme ? settings.theme : {}),
    },
    popoutGrid: {
      ...defaultSettings.popoutGrid,
      ...(typeof settings.popoutGrid === 'object' && settings.popoutGrid
        ? settings.popoutGrid
        : {}),
      items: Array.isArray(settings?.popoutGrid?.items) ? settings.popoutGrid.items : [],
    },
    showSoundGrid:
      typeof settings.showSoundGrid === 'boolean'
        ? settings.showSoundGrid
        : defaultSettings.showSoundGrid,
    showMusicGrid:
      typeof settings.showMusicGrid === 'boolean'
        ? settings.showMusicGrid
        : defaultSettings.showMusicGrid,
  }
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  isInitialized: false,
})

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const handleSettingsUpdate = (_: any, updatedSettings: Settings) => {
      const validated = validateSettings(updatedSettings)
      setSettings(validated)
    }
    window.electronAPI.on('settings-updated', handleSettingsUpdate)

    const initializeSettings = async () => {
      try {
        const savedSettings = await window.electronAPI.loadSettings()
        const validatedSettings = validateSettings(savedSettings)
        setSettings(validatedSettings)
      } catch (error: unknown) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsInitialized(true)
      }
    }
    initializeSettings()
    return () => {
      window.electronAPI.off('settings-updated', handleSettingsUpdate)
    }
  }, [])

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = validateSettings({
        ...prev,
        ...newSettings,
      })

      ;(async () => {
        try {
          await window.electronAPI.saveSettings(updated)
        } catch (error) {
          console.error('Failed to save settings:', error)
        }
      })()

      if ('alwaysOnTop' in newSettings) {
        window.electronAPI.toggleAlwaysOnTop(newSettings.alwaysOnTop ?? false)
      }

      return updated
    })
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isInitialized }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export default SettingsContext
