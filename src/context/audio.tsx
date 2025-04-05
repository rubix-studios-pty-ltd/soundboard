import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import AudioPool, { AudioPoolItem } from '@/utils/audio-pool';
import { useSettings } from '@/context/setting';
import { soundData } from '@/data/audio';
import { musicData } from '@/data/music';

interface AudioContextType {
  playSound: (soundId: string, file: string) => Promise<void>;
  stopAll: () => void;
  stopSound: (file: string) => void;
  isPlaying: (file: string) => boolean;
  preloadStatus: { loaded: number; total: number };
}

const AudioContext = createContext<AudioContextType>({
  playSound: async () => {},
  stopAll: () => {},
  stopSound: () => {},
  isPlaying: () => false,
  preloadStatus: { loaded: 0, total: 0 }
});

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioPoolRef = useRef<AudioPool>(new AudioPool());
  const { settings } = useSettings();
  const [preloadStatus, setPreloadStatus] = useState({ loaded: 0, total: 0 });
  const priorityGroup = useRef<Set<string>>(new Set());

  useEffect(() => {
    const topSounds = [...soundData.slice(0, 12), ...musicData.slice(0, 12)];
    topSounds.forEach(sound => priorityGroup.current.add(sound.file));
  }, []);

  useEffect(() => {
    const allSounds = [...soundData, ...musicData];
    setPreloadStatus({ loaded: 0, total: allSounds.length });

    const loadSounds = async () => {
      for (const sound of allSounds) {
        if (priorityGroup.current.has(sound.file)) {
          try {
            const response = await fetch(sound.file);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            audioPoolRef.current.preloadSound(url, sound.file);
          } catch (error) {
            console.error(`Error preloading priority sound ${sound.file}:`, error);
          }
          setPreloadStatus(prev => ({ ...prev, loaded: prev.loaded + 1 }));
        }
      }

      for (const sound of allSounds) {
        if (!priorityGroup.current.has(sound.file)) {
          try {
            const response = await fetch(sound.file);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            audioPoolRef.current.preloadSound(url, sound.file);
          } catch (error) {
            console.error(`Error preloading sound ${sound.file}:`, error);
          }
          setPreloadStatus(prev => ({ ...prev, loaded: prev.loaded + 1 }));
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };

    loadSounds().catch(console.error);
  }, []);

  useEffect(() => {
    if (settings.volume >= 0 && settings.volume <= 1) {
      audioPoolRef.current.updateVolume(settings.volume);
    }
  }, [settings.volume]);

  const playSound = async (soundId: string, file: string) => {
    try {
      if (!audioPoolRef.current.isPreloaded(file)) {
        const response = await fetch(file);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioPoolRef.current.preloadSound(url, file);
      }

      // If multi-sound is disabled, stop existing sounds
      if (!settings.multiSoundEnabled) {
        audioPoolRef.current.stopAll();
      }

      // If repeat-sound is disabled and the same sound is already playing, stop it
      if (!settings.repeatSoundEnabled && audioPoolRef.current.isPlaying(file)) {
        audioPoolRef.current.stopSpecific(file);
        return;
      }

      const shouldAllowRepeat = settings.repeatSoundEnabled;
      await audioPoolRef.current.play(file, settings.volume, shouldAllowRepeat);
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
    <AudioContext.Provider value={{ playSound, stopAll, stopSound, isPlaying, preloadStatus }}>
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
