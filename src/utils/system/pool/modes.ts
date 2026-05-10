import { type Pool } from '@/types/pool'
import { type PoolState, removeAudio } from '@/utils/system/pool/cleanup'

export function recentInstance(state: PoolState): void {
  const playingSounds = Array.from(state.pool.entries())
    .filter(([_, item]) => item.isPlaying)
    .sort((a, b) => b[1].lastUsed - a[1].lastUsed)

  if (playingSounds.length > 1) {
    const [, mostRecentItem] = playingSounds[0]
    playingSounds.slice(1).forEach(([key]) => {
      removeAudio(state, key)
    })

    state.instanceCounts.clear()
    state.instanceCounts.set(mostRecentItem.source, 1)
  }
}

export function recentSource(state: PoolState): void {
  const soundGroups = new Map<string, [string, Pool][]>()

  for (const entry of state.pool.entries()) {
    const [_key, item] = entry
    if (!item.isPlaying) continue

    if (!soundGroups.has(item.source)) {
      soundGroups.set(item.source, [])
    }

    soundGroups.get(item.source)?.push(entry)
  }

  for (const [source, instances] of soundGroups) {
    if (instances.length > 1) {
      instances.sort((a, b) => b[1].lastUsed - a[1].lastUsed)

      instances.slice(1).forEach(([key]) => {
        removeAudio(state, key)
      })

      state.instanceCounts.set(source, 1)
    }
  }
}
