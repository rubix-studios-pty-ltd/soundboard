import { useCallback, useEffect, useState } from 'react';
import type { HotkeyMap, SoundData } from '@/types';

export const useHotkeys = (soundData: SoundData[], onSoundPlay: (soundId: string) => void) => {
  const [hotkeyMap, setHotkeyMap] = useState<HotkeyMap>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSoundId, setCurrentSoundId] = useState<string | null>(null);

  useEffect(() => {
    const loadHotkeys = async () => {
      try {
        const savedHotkeys = await window.electronAPI.loadHotkeys();
        setHotkeyMap(savedHotkeys);
      } catch (error) {
        console.error('Error loading hotkeys:', error);
        setHotkeyMap({});
      }
    };

    loadHotkeys();
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (modalOpen) return;
    
    const key = event.key.toLowerCase();
    const soundId = Object.entries(hotkeyMap).find(([, hotkey]) => hotkey === key)?.[0];
    
    if (soundId) {
      onSoundPlay(soundId);
    }
  }, [hotkeyMap, modalOpen, onSoundPlay]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const showHotkeyModal = useCallback((soundId: string) => {
    setCurrentSoundId(soundId);
    setModalOpen(true);
  }, []);

  const assignHotkey = useCallback((key: string) => {
    if (!currentSoundId) return;

    setHotkeyMap(prev => {
      // Remove existing assignments for this key
      const newMap = Object.fromEntries(
        Object.entries(prev).filter(([, value]) => value !== key)
      );

      // Add new assignment
      newMap[currentSoundId] = key;

      // Save to electron store
      window.electronAPI.saveHotkeys(newMap);

      return newMap;
    });

    setModalOpen(false);
  }, [currentSoundId]);

  const clearHotkey = useCallback(() => {
    if (!currentSoundId) return;

    setHotkeyMap(prev => {
      const newMap = { ...prev };
      delete newMap[currentSoundId];

      // Save to electron store
      window.electronAPI.saveHotkeys(newMap);

      return newMap;
    });

    setModalOpen(false);
  }, [currentSoundId]);

  return {
    hotkeyMap,
    modalOpen,
    currentSoundId,
    currentHotkey: currentSoundId ? hotkeyMap[currentSoundId] : undefined,
    showHotkeyModal,
    assignHotkey,
    clearHotkey,
    closeModal: () => setModalOpen(false),
  };
};
