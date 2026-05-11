import path from 'node:path'
import { app } from 'electron'

import { type SoundType } from '@/types/sound'

export function getJson(type: SoundType): string {
  return path.join(app.getPath('userData'), `${type}s.json`)
}
