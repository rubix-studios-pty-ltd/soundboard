import { useMemo } from 'react'

import { Footer } from '@/components/controls/footer'
import { Loading } from '@/components/controls/loading'
import { Header } from '@/components/controls/main/header'
import { FavoriteGrid } from '@/components/sounds/favorites'
import { SoundGrid } from '@/components/sounds/main/grid'
import { Separator } from '@/components/ui/separator'
import { AudioProvider, useAudio } from '@/context/audio'
import { SettingsProvider, useSettings } from '@/context/setting'
import { SoundsProvider } from '@/context/sounds'

import '@/styles/tailwind.css'

export function App() {
  return (
    <SettingsProvider>
      <AudioProvider>
        <SoundsProvider>
          <AppContent />
        </SoundsProvider>
      </AudioProvider>
    </SettingsProvider>
  )
}

function AppContent() {
  const { settings, isInitialized: settingsInitialized } = useSettings()
  const { isReady: audioReady } = useAudio()

  const { theme, showSoundGrid, showMusicGrid } = settings

  const themeStyles = useMemo(
    () => ({
      backgroundColor: theme?.enabled ? theme.backgroundColor : undefined,
    }),
    [theme]
  )

  if (!settingsInitialized || !audioReady) return <Loading />

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={themeStyles}>
      <Header />
      <main className="flex-1 overflow-y-auto p-1">
        <FavoriteGrid />
        <div className="flex flex-wrap items-start justify-around gap-1">
          {showSoundGrid && <SoundGrid type="sound" containerId="container1" />}
          {showSoundGrid && showMusicGrid && <Separator className="my-1" />}
          {showMusicGrid && <SoundGrid type="music" containerId="container2" />}
        </div>
      </main>
      <Footer />
    </div>
  )
}
