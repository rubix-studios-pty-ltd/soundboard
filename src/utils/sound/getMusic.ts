import { rawMusicData } from '@/constants/music'
import type { SoundData } from '@/types'
import { generateSoundId } from '@/utils/sound/id'

export const getMusic = (): SoundData[] => {
  return rawMusicData.map(([file, title]) => ({
    id: generateSoundId(file),
    file,
    title,
  }))
}
