import { IpcApi } from '@/types'

declare global {
  interface Window {
    electronAPI: IpcApi
  }
}
