import { rawMusicData } from '@/constants/music'
import { type SoundData } from '@/types/sound'
import { generateId } from '@/utils/sound/generateId'

export const getMusic = (): SoundData[] => {
  return rawMusicData.map(([file, title]) => ({
    id: generateId(file),
    file,
    title,
  }))
}
