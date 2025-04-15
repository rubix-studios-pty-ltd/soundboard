import React, { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"

interface AddSoundModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (type: "sound" | "music", file: File) => void
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes("audio/")) {
      alert("Please select an audio file")
      return
    }

    onAdd(type, file)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] text-white max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-left ">Thêm âm thanh</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label>Loại tiếng</Label>
            <RadioGroup
              value={type}
              onValueChange={(value: "sound" | "music") => setType(value)}
              className="mt-2 flex gap-4"
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
          </div>

          <div>
            <div className="mt-1 space-y-1">
              <Input
                type="file"
                onChange={handleFileChange}
                className="text-sm text-black bg-white cursor-pointer p-2"
              />
              <p className="text-xs text-gray-400">
                Tệp MP3 sẽ được chuyển thành định dạng Opus
              </p>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
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
