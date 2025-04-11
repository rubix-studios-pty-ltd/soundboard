import React, { useMemo } from "react"

import { Separator } from "@/components/ui/separator"
import Footer from "@/components/controls/footer"
import Header from "@/components/controls/header"
import SoundGrid from "@/components/sounds/grid"
import { AudioProvider, useAudio } from "@/context/audio"
import { SettingsProvider, useSettings } from "@/context/setting"
import { soundData } from "@/data/audio"
import { musicData } from "@/data/music"

import "@/styles/tailwind.css"

const App: React.FC = () => (
  <SettingsProvider>
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  </SettingsProvider>
)

const LoadingScreen: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-gray-400">Loading</div>
  </div>
)

const AppContent: React.FC = () => {
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
      <Header />
      <main className="flex-1">
        <div className="flex flex-wrap items-start justify-around gap-2 p-1">
          <SoundGrid sounds={soundData} containerId="container1" />
          <Separator className="my-1" />
          <SoundGrid sounds={musicData} containerId="container2" />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
