import { useCallback, useEffect, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface HotkeyModalProps {
  isOpen: boolean
  onClose: () => void
  onClear: () => void
  currentHotkey?: string
  onAssign: (key: string) => void
}

export function HotkeyModal({
  isOpen,
  onClose,
  onClear,
  currentHotkey,
  onAssign,
}: HotkeyModalProps) {
  const description = useMemo(() => {
    if (currentHotkey) {
      return `Hiện tại: "${currentHotkey}". \nNhấn phím mới để thay đổi.`
    }

    return 'Nhấn một phím bất kỳ để thiết lập phím tắt.'
  }, [currentHotkey])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return
      event.preventDefault()
      const key = event.key.toLowerCase()
      onAssign(key)
    },
    [isOpen, onAssign]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-70">
        <DialogHeader>
          <DialogTitle>Gán phím tắt</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button onClick={onClose}>Đóng</Button>
          {currentHotkey && (
            <Button variant="destructive" onClick={onClear}>
              Xóa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
