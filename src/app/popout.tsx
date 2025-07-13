import React, { useMemo } from "react"

import { AudioProvider, useAudio } from "@/context/audio"
import { SettingsProvider, useSettings } from "@/context/setting"
import { SoundsProvider } from "@/context/sounds"

import "@/styles/tailwind.css"

import HeaderPopout from "@/components/controls/pheader"
import PopoutGrid from "@/components/sounds/popout"

const Popout: React.FC = () => (
  <SettingsProvider>
    <AudioProvider>
      <SoundsProvider>
        <PopoutContent />
      </SoundsProvider>
    </AudioProvider>
  </SettingsProvider>
)

const LoadingScreen: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-gray-400">Loading</div>
  </div>
)

const PopoutContent: React.FC = () => {
  const { settings, isInitialized: settingsInitialized } = useSettings()
  const { isReady: audioReady } = useAudio()

  const themeStyles = useMemo(() => {
    if (settings?.theme?.enabled) {
      return {
        backgroundColor: settings.theme.backgroundColor,
      } as React.CSSProperties
    }
    return {}
  }, [settings?.theme])

  if (!settingsInitialized || !audioReady) {
    return <LoadingScreen />
  }

  return (
    <div
      className="flex min-h-screen flex-col overflow-x-hidden"
      style={themeStyles}
    >
      <HeaderPopout />
      <main className="flex-1">
        <div className="p-1">
          <PopoutGrid />
        </div>
      </main>
    </div>
  )
}

export default Popout
