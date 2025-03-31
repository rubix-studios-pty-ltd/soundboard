import React, { createContext, useContext, useRef, useEffect } from 'react';
import AudioPool, { AudioPoolItem } from '@/utils/audio-pool';
import { useSettings } from '@/context/settingcontext';

interface AudioContextType {
  playSound: (soundId: string, file: string) => Promise<void>;
  stopAll: () => void;
  stopSound: (file: string) => void;
  isPlaying: (file: string) => boolean;
}

const AudioContext = createContext<AudioContextType>({
  playSound: async () => {},
  stopAll: () => {},
  stopSound: () => {},
  isPlaying: () => false,
});

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioPoolRef = useRef<AudioPool>(new AudioPool());
  const { settings } = useSettings();

  // Update volume when settings change
  useEffect(() => {
    if (settings.volume >= 0 && settings.volume <= 1) {
      audioPoolRef.current.updateVolume(settings.volume);
    }
  }, [settings.volume]);

  const playSound = async (soundId: string, file: string) => {
    try {
      const response = await fetch(file);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (!settings.multiSoundEnabled) {
        if (!settings.repeatSoundEnabled) {
          audioPoolRef.current.stopAll();
        } else {
          // In repeat mode, stop all sounds except the current one
          for (const [key, _] of audioPoolRef.current.getPlayingAudios()) {
            if (!key.startsWith(file)) {
              audioPoolRef.current.stopSpecific(key);
            }
          }
        }
      }

      // Allow repeat regardless of multiSound setting
      const shouldAllowRepeat = settings.repeatSoundEnabled;

      await audioPoolRef.current.play(
        url,
        file,
        settings.volume,
        shouldAllowRepeat
      );
      // URL cleanup is now handled by AudioPool
    } catch (error) {
      console.error('Error playing sound:', error);
      audioPoolRef.current.stopSpecific(file);
    }
  };

  const stopAll = () => {
    audioPoolRef.current.stopAll();
  };

  const stopSound = (file: string) => {
    audioPoolRef.current.stopSpecific(file);
  };

  const isPlaying = (file: string) => {
    return audioPoolRef.current.isPlaying(file);
  };

  return (
    <AudioContext.Provider value={{ playSound, stopAll, stopSound, isPlaying }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default AudioContext;
