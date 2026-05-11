import { type SoundType } from '@/types/sound'
import { createAudioData } from '@/utils/audio/createAudioData'

export async function addAudio(file: File, type: SoundType, customTitle?: string) {
  try {
    const sound = await createAudioData(file, type, customTitle)

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
