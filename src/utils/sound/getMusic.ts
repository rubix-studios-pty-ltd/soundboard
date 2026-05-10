import { MusicList } from '@/constants/music'
import { type SoundData } from '@/types/sound'
import { generateId } from '@/utils/audio/generateId'

export const music: SoundData[] = MusicList.map(([file, title]) => ({
  id: generateId(file),
  file,
  title,
}))

export function getMusic(): SoundData[] {
  return music
}
