import { Exit, Maximize, Minimize } from '@/components/icons'

export function WindowsControls() {
  const minimize = () => window.electronAPI.minimizeWindow()
  const maximize = () => window.electronAPI.maximizeWindow()
  const close = () => window.electronAPI.closeWindow()

  return (
    <div className="no-drag flex">
      <button
        type="button"
        onClick={minimize}
        className="flex h-7 w-7 cursor-pointer items-center justify-center text-white transition-colors duration-300 hover:bg-[#333333]"
      >
        <Minimize className="h-4 w-4 text-white" />
      </button>
      <button
        type="button"
        onClick={maximize}
        className="flex h-7 w-7 cursor-pointer items-center justify-center text-white transition-colors duration-300 hover:bg-[#333333]"
      >
        <Maximize className="h-3.5 w-3.5 text-white" />
      </button>
      <button
        type="button"
        onClick={close}
        className="flex h-7 w-7 cursor-pointer items-center justify-center text-white transition-colors duration-300 hover:bg-red-600"
      >
        <Exit className="h-4 w-4 text-white" />
      </button>
    </div>
  )
}
