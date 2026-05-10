import { type SoundData } from '@/types/sound'
import { deleteAudio } from '@/utils/audio/deleteAudio'
import { readAudio } from '@/utils/audio/readAudio'
import { getAsset } from '@/utils/getAsset'
import { getJson } from '@/utils/getJson'
import { validateFile } from '@/utils/validateFile'
import { writePath } from '@/utils/writePath'

export function audioManager(type: 'sound' | 'music') {
  const jsonPath = getJson(type)

  const loadSounds = async (): Promise<SoundData[]> => {
    const sounds = await readAudio(jsonPath)
    const validated: SoundData[] = []

    for (const sound of sounds) {
      if (await validateFile(sound)) {
        validated.push(sound)
      }
    }

    if (validated.length !== sounds.length) {
      await writePath(jsonPath, validated)
    }

    return validated
  }

  return {
    getAll: async () => {
      return await loadSounds()
    },
    add: async (sound: SoundData) => {
      if (await validateFile(sound)) {
        const sounds = await loadSounds()
        sounds.push(sound)
        await writePath(jsonPath, sounds)
      } else {
        throw new Error('Audio file does not exist')
      }
    },
    remove: async (soundId: string) => {
      const sounds = await loadSounds()
      const soundPath = sounds.find((s) => s.id === soundId)
      if (!soundPath) return
      await deleteAudio(getAsset(soundPath.file))
    },
  }
}
