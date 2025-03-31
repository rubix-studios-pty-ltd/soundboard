import React, { useCallback, useEffect, useState } from 'react';

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

  if (!isOpen) return null;

  return (
    <div className="fixed z-[1000] left-0 top-0 w-full h-full bg-black/50 flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg text-center w-[300px]">
        <h2 className="text-base font-bold mb-2.5">Gán Phím Tắt</h2>
        <p className="text-sm mb-5 whitespace-pre-line">{displayText}</p>
        <div className="flex gap-2.5 justify-center">
          <button
            className="bg-black text-white px-6 py-2 cursor-pointer rounded text-xs"
            onClick={onClear}
          >
            Xóa
          </button>
          <button
            className="bg-black text-white px-6 py-2 cursor-pointer rounded text-xs"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default HotkeyModal;
