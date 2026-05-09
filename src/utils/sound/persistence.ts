import { promises as fs } from 'node:fs'

import type { SoundData } from '@/types/sound'
import { shouldLog } from '@/utils/sound/logging'

export async function readSounds(jsonPath: string): Promise<SoundData[]> {
  try {
    const content = await fs.readFile(jsonPath, 'utf-8')
    return JSON.parse(content) as SoundData[]
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined

    if (code === 'ENOENT') {
      return []
    }

    if (shouldLog()) {
      console.error('Error reading sounds JSON:', error)
    }

    return []
  }
}

export async function writeSounds(jsonPath: string, sounds: SoundData[]): Promise<void> {
  try {
    const tempPath = `${jsonPath}.tmp`
    const mode = process.platform === 'darwin' ? 0o644 : undefined

    await fs.writeFile(tempPath, JSON.stringify(sounds, null, 2), {
      encoding: 'utf-8',
      mode,
    })
    await fs.rename(tempPath, jsonPath)
  } catch (error) {
    if (shouldLog()) {
      console.error('Error saving sounds JSON:', error)
    }

    throw error
  }
}

export async function deleteSounds(soundPath: string): Promise<void> {
  try {
    const exists = await fs
      .access(soundPath)
      .then(() => true)
      .catch(() => false)

    if (exists) {
      await fs.unlink(soundPath)
    }
  } catch (error) {
    if (shouldLog()) {
      console.error('Error deleting sound file:', error)
    }
  }
}
