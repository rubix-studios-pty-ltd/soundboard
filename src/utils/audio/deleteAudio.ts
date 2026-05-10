import { promises as fs } from 'node:fs'

export async function deleteAudio(soundPath: string): Promise<void> {
  try {
    await fs.unlink(soundPath)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return
    }

    throw new Error('Failed to delete audio file')
  }
}
