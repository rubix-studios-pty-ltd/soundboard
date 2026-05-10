import { promises as fs } from 'node:fs'

import { type SoundData } from '@/types/sound'

export async function readSounds(jsonPath: string): Promise<SoundData[]> {
  try {
    const content = await fs.readFile(jsonPath, 'utf-8')
    return JSON.parse(content) as SoundData[]
  } catch {
    return []
  }
}
