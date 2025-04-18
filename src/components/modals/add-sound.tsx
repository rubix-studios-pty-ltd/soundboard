import React, { useEffect, useState } from "react"
import LoadingSpinner from "@/components/ui/loading-spinner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface AddSoundModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (type: "sound" | "music", file: File, title?: string) => Promise<void>
  defaultType?: "sound" | "music"
}

const AddSoundModal: React.FC<AddSoundModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  defaultType = "sound",
}) => {
  const [type, setType] = useState<"sound" | "music">(defaultType)

  useEffect(() => {
    setType(defaultType)
  }, [defaultType])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [displayName, setDisplayName] = useState<string>("")

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      setDisplayName("")
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes("audio/") && !file.type.includes("video/")) {
      alert("Please select a valid audio or video file")
      return
    }

    setSelectedFile(file)
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleAdd = async () => {
    if (selectedFile) {
      setIsLoading(true)
      try {
        await onAdd(type, selectedFile, displayName.trim() || undefined)
        setSelectedFile(null)
        setDisplayName("")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[300px] bg-[#1a1a1a] text-white">
        {isLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <LoadingSpinner size="lg" />
              <span>Đang chuyển đổi...</span>
            </div>
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="text-left">Thêm âm thanh</DialogTitle>
          <DialogDescription className="text-left text-sm text-gray-400">
            Thêm tệp âm thanh mới.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            type="text"
            placeholder="Tên âm thanh"
            className="bg-white p-2 text-sm text-black"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            type="file"
            accept="audio/*, video/*"
            onChange={handleFileChange}
            className="cursor-pointer bg-white p-2 text-sm text-black"
          />

          <RadioGroup
            value={type}
            onValueChange={(value: "sound" | "music") => setType(value)}
            className="mt-1 flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="sound" id="sound" />
              <Label htmlFor="sound">Âm thanh</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="music" id="music" />
              <Label htmlFor="music">Âm nhạc</Label>
            </div>
          </RadioGroup>

          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleAdd}
              disabled={!selectedFile || isLoading}
            >
              Thêm
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddSoundModal
