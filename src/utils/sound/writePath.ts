import { promises as fs } from 'node:fs'

import type { SoundData } from '@/types/sound'

export async function writePath(jsonPath: string, sounds: SoundData[]): Promise<void> {
  try {
    const tempPath = `${jsonPath}.tmp`
    const mode = process.platform === 'darwin' ? 0o644 : undefined

    await fs.writeFile(tempPath, JSON.stringify(sounds, null, 2), {
      encoding: 'utf-8',
      mode,
    })
    await fs.rename(tempPath, jsonPath)
  } catch {
    throw new Error('Failed to write sounds data')
  }
}
