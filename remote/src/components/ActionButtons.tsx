interface ActionButtonsProps {
  hasHistory: boolean;
  onSend: () => void;
  onEnter: () => void;
  onUndo: () => void;
  onClear: () => void;
}

export default function ActionButtons({
  hasHistory,
  onSend,
  onEnter,
  onUndo,
  onClear,
}: ActionButtonsProps) {
  return (
    <div className="w-full flex gap-2">
      <button
        onClick={onSend}
        className="flex-1 py-3 px-2 rounded-lg text-white text-[15px] font-medium active:opacity-80 active:scale-[0.96] transition-all"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        发送
      </button>
      <button
        onClick={onEnter}
        className="flex-1 py-3 px-2 rounded-lg text-white text-[15px] font-medium active:opacity-80 active:scale-[0.96] transition-all"
        style={{ backgroundColor: "var(--color-enter)" }}
      >
        回车
      </button>
      <button
        onClick={onUndo}
        disabled={!hasHistory}
        className="flex-1 py-3 px-2 rounded-lg text-white text-[15px] font-medium active:opacity-80 active:scale-[0.96] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          backgroundColor: hasHistory
            ? "var(--color-undo-active)"
            : "var(--color-undo)",
        }}
      >
        撤销
      </button>
      <button
        onClick={onClear}
        className="flex-1 py-3 px-2 rounded-lg text-white text-[15px] font-medium active:opacity-80 active:scale-[0.96] transition-all"
        style={{ backgroundColor: "var(--color-clear)" }}
      >
        清空
      </button>
    </div>
  );
}
