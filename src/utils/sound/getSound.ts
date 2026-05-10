import { SoundList } from '@/constants/audio'
import { type SoundData } from '@/types/sound'
import { generateId } from '@/utils/audio/generateId'

export const sound: SoundData[] = SoundList.map(([file, title]) => ({
  id: generateId(file),
  file,
  title,
}))

export function getSound(): SoundData[] {
  return sound
}
