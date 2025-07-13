import React, { useState } from "react"

import { Exit, Minimize } from "@/components/icons"
import AddSoundModal from "@/components/modals/add-sound"
import { useSounds } from "@/context/sounds"
import { addNewSound } from "@/utils/audio-convert"

const Header: React.FC = () => {
  const { addSound } = useSounds()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleAddSound = async (
    type: "sound" | "music",
    file: File,
    title?: string
  ) => {
    const newSound = await addNewSound(file, type, title)
    addSound(newSound, type)
    setIsAddModalOpen(false)
  }

  const handleMinimize = () =>
    window.electronAPI.windowControl("minimize", "popout")
  const handleClose = () => window.electronAPI.windowControl("close", "popout")

  return (
    <div className="sticky top-0 z-50 flex h-7 items-center justify-between border-b-[1px] border-[#333333] bg-[#1a1a1a]">
      <div className="draggable flex flex-1 flex-row items-center justify-end">
        <button
          onClick={handleMinimize}
          className="flex h-7 w-7 cursor-pointer items-center justify-center text-white transition-colors duration-300 hover:bg-[#333333]"
        >
          <Minimize className="h-4 w-4 text-white" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-7 w-7 cursor-pointer items-center justify-center text-white transition-colors duration-300 hover:bg-red-600"
        >
          <Exit className="h-4 w-4 text-white" />
        </button>
      </div>

      <AddSoundModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSound}
      />
    </div>
  )
}

export default Header
