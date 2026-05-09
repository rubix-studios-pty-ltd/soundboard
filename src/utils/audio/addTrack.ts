import { createId } from '@/utils/audio/createId'

export async function addTrack(file: File, type: 'sound' | 'music', customTitle?: string) {
  try {
    const soundData = await createId(file, type, customTitle)

    await window.electronAPI.addSound({
      sound: soundData,
      type,
    })

    return soundData
  } catch (error) {
    console.error('Failed to add sound:', error)
    throw error
  }
}
