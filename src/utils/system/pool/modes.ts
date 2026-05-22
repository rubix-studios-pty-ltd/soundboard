import { type Pool } from '@/types/pool'
import { type PoolState, removeAudio } from '@/utils/system/pool/cleanup'

export function singlePool(state: PoolState): void {
  const poolGroups = Array.from(state.pool.entries())
    .filter(([_, item]) => item.isPlaying)
    .sort((a, b) => b[1].lastUsed - a[1].lastUsed)

  if (poolGroups.length > 1) {
    const [, mostRecentItem] = poolGroups[0]
    poolGroups.slice(1).forEach(([key]) => {
      removeAudio(state, key)
    })

    state.instanceCounts.clear()
    state.instanceCounts.set(mostRecentItem.source, 1)
  }
}

export function singleItem(state: PoolState): void {
  const audioGroups = new Map<string, [string, Pool][]>()

  for (const entry of state.pool.entries()) {
    const [_, item] = entry
    if (!item.isPlaying) continue

    if (!audioGroups.has(item.source)) {
      audioGroups.set(item.source, [])
    }

    audioGroups.get(item.source)?.push(entry)
  }

  for (const [source, instances] of audioGroups) {
    if (instances.length > 1) {
      instances.sort((a, b) => b[1].lastUsed - a[1].lastUsed)

      instances.slice(1).forEach(([key]) => {
        removeAudio(state, key)
      })

      state.instanceCounts.set(source, 1)
    }
  }
}
