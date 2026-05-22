interface CursorButtonsProps {
  onMove: (direction: string) => void;
}

export default function CursorButtons({ onMove }: CursorButtonsProps) {
  const directions = [
    { key: "left", label: "←" },
    { key: "up", label: "↑" },
    { key: "down", label: "↓" },
    { key: "right", label: "→" },
  ];

  return (
    <div className="w-full flex gap-2">
      {directions.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onMove(key)}
          className="flex-1 py-3 px-2 rounded-lg text-white text-base font-bold active:opacity-80 active:scale-[0.96] transition-all"
          style={{ backgroundColor: "var(--color-cursor)" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
