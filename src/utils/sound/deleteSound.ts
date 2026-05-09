import { promises as fs } from 'node:fs'

export async function deleteSounds(soundPath: string): Promise<void> {
  try {
    const exists = await fs
      .access(soundPath)
      .then(() => true)
      .catch(() => false)

    if (exists) {
      await fs.unlink(soundPath)
    }
  } catch {
    throw new Error('Failed to delete sound file')
  }
}
