import { createId } from '@/utils/audio/createId'

export async function addTrack(file: File, type: 'sound' | 'music', customTitle?: string) {
  try {
    const sound = await createId(file, type, customTitle)

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
