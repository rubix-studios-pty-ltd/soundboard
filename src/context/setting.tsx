import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Settings } from '@/types';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  multiSoundEnabled: true,
  repeatSoundEnabled: false,
  alwaysOnTop: false,
  volume: 1,
  hideEnabled: false,
  hiddenSounds: [] as string[],
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    window.electronAPI.loadSettings().then((savedSettings) => {
      setSettings(savedSettings);
    });
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { 
        ...prev, 
        ...newSettings,
        // Ensure hiddenSounds is always an array
        hiddenSounds: Array.isArray(newSettings.hiddenSounds) ? newSettings.hiddenSounds : (prev.hiddenSounds || [])
      };
      window.electronAPI.saveSettings(updated);
      if ('alwaysOnTop' in newSettings) {
        window.electronAPI.toggleAlwaysOnTop(newSettings.alwaysOnTop ?? false);
      }
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
