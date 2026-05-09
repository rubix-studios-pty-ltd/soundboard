import type { SoundData } from '@/types'
import { generateId } from '@/utils/sound/generateId'

export const createId = async (file: File, type: 'sound' | 'music', customTitle?: string) => {
  try {
    if (!file.type.startsWith('audio/')) {
      throw new Error('Unsupported file type. Only audio files are allowed.')
    }

    const arrayBuffer = await file.arrayBuffer()
    const result = await window.electronAPI.convertAudio({
      buffer: arrayBuffer,
      originalName: file.name,
      type: type,
    })

    const title = (customTitle || file.name.replace(/\.[^/.]+$/, '')).replace(/[^\w\s-]/g, '')

    const soundData: SoundData = {
      id: generateId(result.outputPath),
      file: result.outputPath,
      title,
      isUserAdded: true,
      format: result.outputPath.endsWith('.opus') ? 'opus' : 'mp3',
    }

    return soundData
  } catch (error) {
    console.error('Error converting file:', error)
    throw error
  }
}
