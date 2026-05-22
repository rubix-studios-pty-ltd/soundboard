import { type SoundType } from '@/types/sound'
import { audioData } from '@/utils/audio/audioData'

export async function addAudio(file: File, type: SoundType, customTitle?: string) {
  try {
    const sound = await audioData(file, type, customTitle)

    await window.electronAPI.addSound({
      sound,
      type,
    })

    return sound
  } catch (error) {
    console.error('Failed to add sound:', error)
    throw error
  }
}
