import { statSync } from "fs"
import path from "path"

import ffmpeg from "fluent-ffmpeg"

const getFfmpeg = (): string | null => {
  const platformBinary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"

  const pathsToTry = [
    path.join(path.dirname(process.execPath), platformBinary),
    path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      "ffmpeg-static",
      platformBinary
    ),
  ]

  for (const tryPath of pathsToTry) {
    try {
      if (statSync(tryPath).isFile()) {
        return tryPath
      }
    } catch {
      // ignore missing file
    }
  }

  return null
}

const ffmpegPath = getFfmpeg()

export async function convertToOpus(
  filePath: string,
  outputPath: string
): Promise<void> {
  if (!ffmpegPath) {
    throw new Error("FFmpeg binary not found.")
  }

  ffmpeg.setFfmpegPath(ffmpegPath)

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .toFormat("opus")
      .audioFilters(["loudnorm=I=-5:TP=-1.5:LRA=11", "dynaudnorm=f=150:g=5"])
      .audioFrequency(48000)
      .audioBitrate("64k")
      .outputOptions(["-map_metadata", "-1"])
      .save(outputPath)
      .on("end", resolve)
      .on("error", (err) => {
        console.error("FFmpeg conversion error:", err)
        reject(err)
      })
  })
}
