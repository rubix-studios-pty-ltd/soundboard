import ffmpeg from 'fluent-ffmpeg'

import { getFfmpeg } from '@/utils/audio/getFfmpeg'

const audioFilters = ['loudnorm=I=-5:TP=-1.5:LRA=11', 'dynaudnorm=f=150:g=5']

export async function convertOpus(filePath: string, outputPath: string): Promise<void> {
  const resolved = getFfmpeg()

  if (!resolved) {
    throw new Error('FFmpeg binary not found.')
  }

  ffmpeg.setFfmpegPath(resolved)

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .toFormat('opus')
      .audioFilters(audioFilters)
      .audioFrequency(48000)
      .audioBitrate('64k')
      .outputOptions(['-map_metadata', '-1'])
      .save(outputPath)
      .on('end', resolve)
      .on('error', (err) => {
        console.error('FFmpeg conversion error:', err)
        reject(err)
      })
  })
}
