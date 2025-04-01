import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';

interface HotkeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  currentHotkey?: string;
  onAssign: (key: string) => void;
}

const HotkeyModal: React.FC<HotkeyModalProps> = ({
  isOpen,
  onClose,
  onClear,
  currentHotkey,
  onAssign,
}) => {
  const [displayText, setDisplayText] = useState('Nhấn bất kỳ phím nào để gán');

  useEffect(() => {
    if (currentHotkey) {
      setDisplayText(`Hiện tại: "${currentHotkey}". \nNhấn phím mới để thay đổi.`);
    } else {
      setDisplayText('Nhấn bất kỳ phím nào để gán');
    }
  }, [currentHotkey]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isOpen) {
      event.preventDefault();
      const key = event.key.toLowerCase();
      onAssign(key);
    }
  }, [isOpen, onAssign]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[280px]">
        <DialogHeader>
          <DialogTitle>Gán phím tắt</DialogTitle>
          <DialogDescription>
            {displayText}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button onClick={onClose}>
            Đóng
          </Button>
          {currentHotkey && (
            <Button variant="destructive" onClick={onClear}>
              Xóa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HotkeyModal;
