import { promises as fs } from 'node:fs'

import type { SoundData } from '@/types/sound'
import { shouldLog } from '@/utils/sound/logging'
import { getAsset } from '@/utils/sound/paths'

export async function validateFile(sound: SoundData): Promise<boolean> {
  try {
    await fs.access(getAsset(sound.file))
    return true
  } catch (error) {
    if (shouldLog()) {
      console.error(`Error validating sound ${sound.id}:`, error)
    }

    return false
  }
}
