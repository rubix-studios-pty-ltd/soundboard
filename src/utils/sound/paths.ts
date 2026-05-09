import path from 'node:path'
import { app } from 'electron'

export function getJson(type: 'sound' | 'music'): string {
  return path.join(app.getPath('userData'), `${type}s.json`)
}

export function getAsset(file: string): string {
  return path.normalize(path.join(app.getPath('userData'), 'sounds', file))
}
