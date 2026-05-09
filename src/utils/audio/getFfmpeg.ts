import { statSync } from 'node:fs'
import path from 'node:path'

export function getFfmpeg() {
  const platform = process.platform
  const platformFolder =
    platform === 'darwin' ? (process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64') : 'win32'
  const platformBinary = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'

  const pathsToTry = [
    path.join(__dirname, '..', 'vendor', 'ffmpeg', platformFolder, platformBinary),
    path.join(process.resourcesPath, 'ffmpeg', platformFolder, platformBinary),
  ]

  for (const tryPath of pathsToTry) {
    try {
      if (statSync(tryPath).isFile()) {
        return tryPath
      }
    } catch {
      // File missing
    }
  }

  return null
}
