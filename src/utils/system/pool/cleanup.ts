import { type Pool } from '@/types/pool'
import { recycleAudio } from '@/utils/system/pool/lifecycle'

export interface PoolState {
  pool: Map<string, Pool>
  instanceCounts: Map<string, number>
  maxPool: number
  maxInstances: number
  unusedAudio: HTMLAudioElement[]
}

export function detachAudio(poolItem: Pool): void {
  poolItem.cleanupListeners?.forEach((cleanup) => {
    cleanup()
  })
  poolItem.cleanupListeners = []
}

export function reduceCount(instanceCounts: Map<string, number>, source: string): void {
  const currentCount = instanceCounts.get(source) || 0
  instanceCounts.set(source, Math.max(0, currentCount - 1))
}

export function releaseAudio(state: PoolState, poolItem: Pool): void {
  detachAudio(poolItem)
  poolItem.audio.src = ''
  poolItem.isPlaying = false
  reduceCount(state.instanceCounts, poolItem.source)
  recycleAudio(poolItem.audio, state.unusedAudio, state.maxPool)
}

export function finalizePoolItem(
  state: PoolState,
  poolItem: Pool,
  options: { removeKey?: string } = {}
): void {
  poolItem.isPlaying = false
  poolItem.onEnd?.()
  releaseAudio(state, poolItem)

  if (options.removeKey) {
    state.pool.delete(options.removeKey)
  }
}

export function removeAudio(state: PoolState, key: string): void {
  const item = state.pool.get(key)
  if (!item) return

  releaseAudio(state, item)
  state.pool.delete(key)
}

export function audioSource(pool: Map<string, Pool>, source: string): [string, Pool][] {
  return Array.from(pool.entries()).filter(([, item]) => item.source === source)
}

export function pruneOldest(state: PoolState): boolean {
  let lruItem: [string, Pool] | undefined

  for (const [key, item] of state.pool.entries()) {
    if (!item.isPlaying && (!lruItem || item.lastUsed < lruItem[1].lastUsed)) {
      lruItem = [key, item]
    }
  }

  if (!lruItem) return false

  removeAudio(state, lruItem[0])
  return true
}

export function pruneSource(state: PoolState, source: string): boolean {
  const instances = audioSource(state.pool, source)
  if (instances.length < state.maxInstances) {
    return false
  }

  instances.sort((a, b) => a[1].lastUsed - b[1].lastUsed)
  removeAudio(state, instances[0][0])
  return true
}

export function stoppedAudio(pool: Map<string, Pool>): Pool | undefined {
  for (const [, item] of pool) {
    if (!item.isPlaying && (item.audio.ended || item.audio.paused)) {
      return item
    }
  }

  return undefined
}

export function clearPool(state: PoolState): void {
  state.pool.forEach((item) => {
    releaseAudio(state, item)
  })
  state.pool.clear()
  state.instanceCounts.clear()
}
