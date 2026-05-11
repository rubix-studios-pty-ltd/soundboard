import { spawn } from 'node:child_process'

import { getFfmpeg } from '@/utils/audio/getFfmpeg'

const audioFilters = ['loudnorm=I=-5:TP=-1.5:LRA=11', 'dynaudnorm=f=150:g=5']

export async function convertOpus(filePath: string, outputPath: string): Promise<void> {
  const resolved = getFfmpeg()

  if (!resolved) {
    throw new Error('FFmpeg binary not found.')
  }

  const args = [
    '-y',
    '-i',
    filePath,
    '-vn',
    '-c:a',
    'libopus',
    '-af',
    audioFilters.join(','),
    '-ar',
    '48000',
    '-b:a',
    '64k',
    '-map_metadata',
    '-1',
    outputPath,
  ]

  return new Promise((resolve, reject) => {
    const process = spawn(resolved, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    })

    let stderr = ''

    process.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    process.on('error', (err) => {
      console.error('FFmpeg conversion error:', err)
      reject(err)
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      const error = new Error(
        `FFmpeg conversion failed with exit code ${String(code)}${stderr ? `: ${stderr}` : ''}`
      )
      console.error('FFmpeg conversion error:', error)
      reject(error)
    })
  })
}
