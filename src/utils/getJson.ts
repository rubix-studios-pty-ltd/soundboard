import path from 'node:path'
import { app } from 'electron'

export function getJson(type: 'sound' | 'music'): string {
  return path.join(app.getPath('userData'), `${type}s.json`)
}
