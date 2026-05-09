import { createSoundData } from '@/utils/audio/createSoundData'

export async function addTrack(file: File, type: 'sound' | 'music', customTitle?: string) {
  try {
    const sound = await createSoundData(file, type, customTitle)

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
