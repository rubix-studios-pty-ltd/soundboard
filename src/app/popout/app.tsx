import { type FC, useMemo } from 'react'

import { AudioProvider, useAudio } from '@/context/audio'
import { SettingsProvider, useSettings } from '@/context/setting'
import { SoundsProvider } from '@/context/sounds'

import '@/styles/tailwind.css'

import Header from '@/components/controls/popout/header'
import SoundGrid from '@/components/sounds/popout/grid'

const App: FC = () => (
  <SettingsProvider>
    <AudioProvider>
      <SoundsProvider>
        <PopoutContent />
      </SoundsProvider>
    </AudioProvider>
  </SettingsProvider>
)

const LoadingScreen: FC = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-gray-400">Loading</div>
  </div>
)

const PopoutContent: FC = () => {
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

export default App
