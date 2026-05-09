import { useMemo, type CSSProperties } from 'react'

import { AudioProvider, useAudio } from '@/context/audio'
import { SettingsProvider, useSettings } from '@/context/setting'
import { SoundsProvider } from '@/context/sounds'

import { Header } from '@/components/controls/popout/header'
import { SoundGrid } from '@/components/sounds/popout/grid'

import '@/styles/tailwind.css'

export function App() {
  return (
    <SettingsProvider>
      <AudioProvider>
        <SoundsProvider>
          <PopoutContent />
        </SoundsProvider>
      </AudioProvider>
    </SettingsProvider>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-gray-400">Loading</div>
    </div>
  )
}

function PopoutContent() {
  const { settings, isInitialized: settingsInitialized } = useSettings()
  const { isReady: audioReady } = useAudio()

  const themeStyles = useMemo<CSSProperties>(() => {
    if (settings?.theme?.enabled) {
      return {
        backgroundColor: settings.theme.backgroundColor,
      }
    }

    return {}
  }, [settings?.theme])

  if (!settingsInitialized || !audioReady) {
    return <LoadingScreen />
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden" style={themeStyles}>
      <Header />

      <main className="flex-1">
        <div className="p-1">
          <SoundGrid />
        </div>
      </main>
    </div>
  )
}
