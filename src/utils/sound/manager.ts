import { type SoundData } from '@/types/sound'
import { deleteSounds } from '@/utils/sound/deleteSound'
import { getAsset, getJson } from '@/utils/sound/paths'
import { readSounds } from '@/utils/sound/readSound'
import { validateFile } from '@/utils/sound/validation'
import { writePath } from '@/utils/sound/writePath'

export function soundsManager(type: 'sound' | 'music') {
  const jsonPath = getJson(type)

  const loadSounds = async (): Promise<SoundData[]> => {
    const sounds = await readSounds(jsonPath)
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
        throw new Error('Sound file does not exist')
      }
    },
    remove: async (soundId: string) => {
      const sounds = await loadSounds()
      const soundPath = sounds.find((s) => s.id === soundId)
      if (!soundPath) return
      await deleteSounds(getAsset(soundPath.file))
    },
  }
}
