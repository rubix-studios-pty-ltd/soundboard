import { type Pool } from '@/types/pool'
import { finalizePoolItem, type PoolState } from '@/utils/system/pool/cleanup'

export function audioListeners(state: PoolState, poolItem: Pool): void {
  const endedListener = () => {
    finalizePoolItem(state, poolItem)
  }

  const pauseListener = () => {
    if (!poolItem.audio.ended) {
      finalizePoolItem(state, poolItem)
    }
  }

  const errorListener = () => {
    const itemKey = Array.from(state.pool.entries()).find(([_, item]) => item === poolItem)?.[0]

    if (itemKey) {
      finalizePoolItem(state, poolItem, { removeKey: itemKey })
    }
  }

  poolItem.audio.addEventListener('ended', endedListener)
  poolItem.audio.addEventListener('pause', pauseListener)
  poolItem.audio.addEventListener('error', errorListener)

  poolItem.cleanupListeners = [
    () => poolItem.audio.removeEventListener('ended', endedListener),
    () => poolItem.audio.removeEventListener('pause', pauseListener),
    () => poolItem.audio.removeEventListener('error', errorListener),
  ]
}
