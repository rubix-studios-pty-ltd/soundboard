import type { SoundData } from '@/types'
import { shouldLog } from '@/utils/sound/logging'
import { getAsset, getJson } from '@/utils/sound/paths'
import { deleteSounds, readSounds, writeSounds } from '@/utils/sound/persistence'
import { validateFile } from '@/utils/sound/validation'

export function soundsManager(type: 'sound' | 'music') {
  const jsonPath = getJson(type)

  const loadSounds = async (): Promise<SoundData[]> => {
    const sounds = await readSounds(jsonPath)
    const validated: SoundData[] = []

    for (const sound of sounds) {
      if (await validateFile(sound)) {
        validated.push(sound)
      } else if (shouldLog()) {
        console.log(`Removing stale sound entry: ${sound.id}`)
      }
    }

    if (validated.length !== sounds.length) {
      await writeSounds(jsonPath, validated)
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
        await writeSounds(jsonPath, sounds)
      } else {
        throw new Error('Sound file does not exist')
      }
    },
    remove: async (soundId: string) => {
      const sounds = await loadSounds()
      const soundToRemove = sounds.find((s) => s.id === soundId)
      if (!soundToRemove) {
        return
      }

      const filtered = sounds.filter((s) => s.id !== soundId)
      await writeSounds(jsonPath, filtered)

      await deleteSounds(getAsset(soundToRemove.file))
    },
  }
}
