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
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]"
      onClick={handleBackdropClick}
    >
      <div className="w-[90%] max-w-[400px] bg-white p-5 rounded-2xl flex flex-col gap-4">
        <input
          ref={inputRef}
          type="text"
          onKeyDown={handleKeyDown}
          placeholder="请输入内容..."
          className="w-full p-3.5 text-base border-2 border-[var(--color-primary)] rounded-lg focus:outline-none focus:border-[var(--color-primary-dark)]"
        />
        <button
          onClick={handleConfirm}
          className="p-3 text-base text-white border-none rounded-lg cursor-pointer active:opacity-80"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          确认
        </button>
      </div>
    </div>
  );
}
