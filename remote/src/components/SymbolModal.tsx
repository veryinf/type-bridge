import { useRef, useEffect, KeyboardEvent } from "react";

interface SymbolModalProps {
  symbol: string;
  onConfirm: (text: string) => void;
  onClose: () => void;
}

export default function SymbolModal({
  symbol,
  onConfirm,
  onClose,
}: SymbolModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleConfirm = () => {
    const content = inputRef.current?.value.trim();
    if (!content) {
      onClose();
      return;
    }
    const half = symbol.length / 2;
    const left = symbol.substring(0, half);
    const right = symbol.substring(half);
    onConfirm(left + content + right);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content">
        <input
          ref={inputRef}
          type="text"
          onKeyDown={handleKeyDown}
          placeholder="请输入内容..."
        />
        <button className="modal-confirm" onClick={handleConfirm}>
          确认
        </button>
      </div>
    </div>
  );
}
