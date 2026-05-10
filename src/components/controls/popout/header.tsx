import { Exit, Minimize } from '@/components/icons'

export function Header() {
  const minimize = () => window.electronAPI.windowControl('minimize', 'popout')
  const close = () => window.electronAPI.windowControl('close', 'popout')

  return (
    <div className="sticky top-0 z-50 flex h-7 items-center justify-between border-b border-[#333333] bg-[#1a1a1a]">
      <div className="draggable flex flex-1 flex-row items-center justify-end">
        <button
          type="button"
          onClick={minimize}
          className="flex h-7 w-7 cursor-pointer items-center justify-center text-white transition-colors duration-300 hover:bg-[#333333]"
        >
          <Minimize className="h-4 w-4 text-white" />
        </button>

        <button
          type="button"
          onClick={close}
          className="flex h-7 w-7 cursor-pointer items-center justify-center text-white transition-colors duration-300 hover:bg-red-600"
        >
          <Exit className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  )
}
