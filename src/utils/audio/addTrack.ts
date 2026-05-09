import { convertTrack } from '@/utils/audio/convert'

export async function addTrack(file: File, type: 'sound' | 'music', customTitle?: string) {
  try {
    const soundData = await convertTrack(file, type, customTitle)

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
