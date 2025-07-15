import { app } from "electron"
import { promises as fs } from "fs"
import path from "path"

import type { SoundData } from "@/types"

const shouldLog = () => process.argv.includes("--enable-logging")

export function createSoundsManager(type: "sound" | "music") {
  const jsonPath = path.join(app.getPath("userData"), `${type}s.json`)

  const validateSound = async (sound: SoundData): Promise<boolean> => {
    try {
      const soundPath = path.normalize(
        path.join(app.getPath("userData"), "sounds", sound.file)
      )
      await fs.access(soundPath)
      return true
    } catch (error) {
      if (shouldLog()) {
        console.error(`Error validating sound ${sound.id}:`, error)
      }
      return false
    }
  }

  const loadSounds = async (): Promise<SoundData[]> => {
    try {
      const exists = await fs
        .access(jsonPath)
        .then(() => true)
        .catch(() => false)
      if (exists) {
        const content = await fs.readFile(jsonPath, "utf-8")
        const sounds = JSON.parse(content) as SoundData[]

        const validatedSounds = []
        for (const sound of sounds) {
          if (await validateSound(sound)) {
            validatedSounds.push(sound)
          } else if (shouldLog()) {
            console.log(`Removing stale sound entry: ${sound.id}`)
          }
        }

        if (validatedSounds.length !== sounds.length) {
          await saveSounds(validatedSounds)
        }

        return validatedSounds
      }
      return []
    } catch (error) {
      if (shouldLog()) console.error("Error reading sounds JSON:", error)
      return []
    }
  }

  const saveSounds = async (sounds: SoundData[]): Promise<void> => {
    try {
      const tempPath = `${jsonPath}.tmp`
      const mode = process.platform === "darwin" ? 0o644 : undefined
      await fs.writeFile(tempPath, JSON.stringify(sounds, null, 2), {
        encoding: "utf-8",
        mode,
      })
      await fs.rename(tempPath, jsonPath)
    } catch (error) {
      if (shouldLog()) console.error("Error saving sounds JSON:", error)
      throw error
    }
  }

  return {
    getAll: async () => {
      return await loadSounds()
    },
    add: async (sound: SoundData) => {
      if (await validateSound(sound)) {
        const sounds = await loadSounds()
        sounds.push(sound)
        await saveSounds(sounds)
      } else {
        throw new Error("Sound file does not exist")
      }
    },
    remove: async (soundId: string) => {
      const sounds = await loadSounds()
      const soundToRemove = sounds.find((s) => s.id === soundId)
      if (!soundToRemove) {
        return
      }

      const filteredSounds = sounds.filter((s) => s.id !== soundId)
      await saveSounds(filteredSounds)

      try {
        const soundPath = path.normalize(
          path.join(app.getPath("userData"), "sounds", soundToRemove.file)
        )
        const exists = await fs
          .access(soundPath)
          .then(() => true)
          .catch(() => false)
        if (exists) {
          await fs.unlink(soundPath)
        }
      } catch (error) {
        if (shouldLog()) console.error("Error deleting sound file:", error)
      }
    },
  }
}
