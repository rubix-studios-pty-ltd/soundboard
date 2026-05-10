import { IPC } from '@/types/ipc'

declare global {
  interface Window {
    electronAPI: IPC
  }
}
