import { ipcRenderer } from "electron"

import { SoundData } from "@/types"
import { generateSoundId } from "@/utils/sound-id"

export const convertToOpus = async (
  file: File,
  type: "sound" | "music",
  customTitle?: string
) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await window.electronAPI.convertAudio({
      buffer: arrayBuffer,
      originalName: file.name,
      type: type,
    })

    const soundData: SoundData = {
      id: generateSoundId(result.outputPath),
      file: result.outputPath,
      title: customTitle || file.name.replace(/\.[^/.]+$/, ""),
      isUserAdded: true,
      format: "opus",
    }

    return soundData
  } catch (error) {
    console.error("Error converting file:", error)
    throw error
  }
}

export const addNewSound = async (
  file: File,
  type: "sound" | "music",
  customTitle?: string
) => {
  try {
    const soundData = await convertToOpus(file, type, customTitle)

    await window.electronAPI.addSound({
      sound: soundData,
      type: type,
    })

    return soundData
  } catch (error) {
    console.error("Failed to add sound:", error)
    throw error
  }
}
