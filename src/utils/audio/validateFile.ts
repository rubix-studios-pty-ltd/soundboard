import { promises as fs } from 'node:fs'

import { type SoundData } from '@/types/sound'
import { getAsset } from '@/utils/getAsset'

export async function validateFile(sound: SoundData): Promise<boolean> {
  try {
    await fs.access(getAsset(sound.file))
    return true
  } catch {
    return false
  }
}
