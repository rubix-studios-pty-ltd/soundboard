import { rawSoundData } from '@/constants/audio'
import type { SoundData } from '@/types'
import { generateSoundId } from '@/utils/sound/id'

export const getSound = (): SoundData[] => {
  return rawSoundData.map(([file, title]) => ({
    id: generateSoundId(file),
    file,
    title,
  }))
}
