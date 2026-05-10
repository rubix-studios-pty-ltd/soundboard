import path from 'node:path'
import { app } from 'electron'

export function getAsset(file: string): string {
  return path.normalize(path.join(app.getPath('userData'), 'sounds', file))
}
