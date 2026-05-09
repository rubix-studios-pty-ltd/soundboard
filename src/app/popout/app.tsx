import { useMemo } from 'react'
import { Loading } from '@/components/controls/loading'
import { Header } from '@/components/controls/popout/header'
import { SoundGrid } from '@/components/sounds/popout/grid'
import { AudioProvider, useAudio } from '@/context/audio'
import { SettingsProvider, useSettings } from '@/context/setting'
import { SoundsProvider } from '@/context/sounds'

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

function PopoutContent() {
  const { settings, isInitialized: settingsInitialized } = useSettings()
  const { isReady: audioReady } = useAudio()

  const { theme } = settings

  const themeStyles = useMemo(
    () => ({
      backgroundColor: theme?.enabled ? theme.backgroundColor : undefined,
    }),
    [theme]
  )

  if (!settingsInitialized || !audioReady) return <Loading />

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden" style={themeStyles}>
      <Header />
      <main className="flex-1 p-1">
        <SoundGrid />
      </main>
    </div>
  )
}
