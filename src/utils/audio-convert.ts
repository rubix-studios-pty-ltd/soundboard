import { ipcRenderer } from "electron"

import { SoundData } from "@/types"

export const convertToOpus = async (file: File, type: "sound" | "music") => {
  // Create a temporary object URL for the file
  const fileUrl = URL.createObjectURL(file)

  try {
    // Send the file to the main process for conversion
    const result = await window.electronAPI.convertAudio({
      url: fileUrl,
      originalName: file.name,
      type: type,
    })

    // Create a new sound data object
    const soundData: SoundData = {
      file: result.outputPath,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      isUserAdded: true,
      format: "opus",
    }

    return soundData
  } finally {
    // Clean up the object URL
    URL.revokeObjectURL(fileUrl)
  }
}

export const addNewSound = async (file: File, type: "sound" | "music") => {
  try {
    const soundData = await convertToOpus(file, type)

    // Add the sound to the appropriate data file
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
