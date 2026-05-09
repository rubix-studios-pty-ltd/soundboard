import { rawSoundData } from '@/constants/audio'
import type { SoundData } from '@/types/sound'
import { generateId } from '@/utils/sound/generateId'

export const getSound = (): SoundData[] => {
  return rawSoundData.map(([file, title]) => ({
    id: generateId(file),
    file,
    title,
  }))
}
