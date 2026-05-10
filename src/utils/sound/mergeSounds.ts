import { type SoundData } from '@/types/sound'
import { generateId } from '@/utils/sound/generateId'

export function mergeSounds(defaults: SoundData[], userSounds: SoundData[]): SoundData[] {
  const map = new Map<string, SoundData>()

  for (const sound of defaults) {
    map.set(sound.file, {
      ...sound,
      id: generateId(sound.file),
    })
  }

  for (const sound of userSounds) {
    if (!map.has(sound.file)) {
      map.set(sound.file, sound)
    }
  }

  return Array.from(map.values())
}
