interface SymbolButtonsProps {
  onOpen: (symbol: string) => void;
}

const SYMBOLS = [
  { pair: "()", label: "（）" },
  { pair: '""', label: '""' },
  { pair: "「」", label: "「」" },
  { pair: "[]", label: "[]" },
];

export default function SymbolButtons({ onOpen }: SymbolButtonsProps) {
  return (
    <div className="w-full flex gap-2">
      {SYMBOLS.map(({ pair, label }) => (
        <button
          key={pair}
          onClick={() => onOpen(pair)}
          className="flex-1 py-3 px-2 rounded-lg text-white text-sm font-medium active:opacity-80 active:scale-[0.96] transition-all"
          style={{ backgroundColor: "var(--color-symbol)" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
