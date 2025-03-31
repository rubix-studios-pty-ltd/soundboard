import React from 'react';
import { SettingsProvider } from '@/context/settingcontext';
import { AudioProvider } from '@/context/audiocontext';
import Header from '@/components/controls/header';
import SoundGrid from '@/components/sounds/soundgrid';
import { soundData } from '@/data/audio';
import { musicData } from '@/data/music';
import "@/styles/tailwind.css";

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AudioProvider>
        <div className="min-h-screen">
          <Header />
          <div className="flex flex-wrap items-start justify-around p-1 gap-2">
            <SoundGrid sounds={soundData} containerId="container1" />
            <hr className="w-full border-none border-t border-gray-300 my-1 transition-all duration-300 md:w-[1px]" />
            <SoundGrid sounds={musicData} containerId="container2" />
          </div>
          <hr className="w-full border-none border-t border-gray-300 my-1 transition-all duration-300 md:w-[1px]" />
          <footer className="justify-between">
            <p className="text-[9px] px-1 py-2">
              <span className="mr-0.5">&copy;2025</span> 
              <a 
                href="https://www.rubixstudios.com.au" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-black font-bold no-underline hover:no-underline"
              >
                Rubix Studios
              </a>
            </p>
          </footer>
        </div>
      </AudioProvider>
    </SettingsProvider>
  );
};

export default App;
