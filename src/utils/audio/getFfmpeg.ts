import { existsSync } from 'node:fs'
import path from 'node:path'

export function getFfmpeg() {
  const platform = process.platform
  const folder =
    platform === 'darwin' ? (process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64') : 'win32'
  const binary = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'

  const candidates = [
    path.join(process.resourcesPath, 'ffmpeg', folder, binary),
    path.join(process.cwd(), 'dist', 'vendor', 'ffmpeg', folder, binary),
    path.join(__dirname, 'vendor', 'ffmpeg', folder, binary),
    path.join(__dirname, '..', 'vendor', 'ffmpeg', folder, binary),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return null
}
