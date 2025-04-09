import React, { useMemo } from 'react';
import { SettingsProvider, useSettings } from '@/context/setting';
import { AudioProvider } from '@/context/audio';
import Header from '@/components/controls/header';
import SoundGrid from '@/components/sounds/grid';
import { soundData } from '@/data/audio';
import { musicData } from '@/data/music';
import { Separator } from "@/components/ui/separator"
import "@/styles/tailwind.css";
import Footer from '@/components/controls/footer';

const App: React.FC = () => (
  <SettingsProvider>
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  </SettingsProvider>
);

const AppContent: React.FC = () => {
  const { settings } = useSettings();
  
  const themeStyles = useMemo(() => {
    if (settings?.theme?.enabled) {
      return {
        backgroundColor: settings.theme.backgroundColor
      } as React.CSSProperties;
    }
    return {};
  }, [settings?.theme]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={themeStyles}>
      <Header />
      <div className="flex flex-wrap items-start justify-around p-1 gap-2">
        <SoundGrid sounds={soundData} containerId="container1" />
        <Separator className="my-1" />
        <SoundGrid sounds={musicData} containerId="container2" />
      </div>
      <Footer />
    </div>
  );
};


export default App;
