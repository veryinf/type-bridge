import { ButtonConfig } from "../types/layout";

interface ActionButtonsProps {
  buttons?: ButtonConfig[];
  extraButtons?: ButtonConfig[];
  gridColumns?: number;
  hasHistory?: boolean;
  onButtonClick: (button: ButtonConfig) => void;
}

const DEFAULT_BUTTONS: ButtonConfig[] = [
  { id: "left", label: "←", style: "cursor", commands: [{ action: "key", key: "left" }] },
  { id: "up", label: "↑", style: "cursor", commands: [{ action: "key", key: "up" }] },
  { id: "down", label: "↓", style: "cursor", commands: [{ action: "key", key: "down" }] },
  { id: "right", label: "→", style: "cursor", commands: [{ action: "key", key: "right" }] },
  { id: "delete", label: "删除", style: "delete", commands: [{ action: "key", key: "backspace" }] },
  { id: "undo", label: "撤销", style: "undo", commands: [{ action: "undo" }] },
  { id: "resend", label: "上次", style: "resend", clientAction: "resend" },
  { id: "symbol1", label: "（）", style: "symbol", clientAction: "symbol", params: "()" },
];

const DEFAULT_EXTRA: ButtonConfig[] = [
  { id: "symbol2", label: '""', style: "symbol", clientAction: "symbol", params: '""' },
  { id: "symbol3", label: "「」", style: "symbol", clientAction: "symbol", params: "「」" },
  { id: "symbol4", label: "[]", style: "symbol", clientAction: "symbol", params: "[]" },
];

export default function ActionButtons({
  buttons = DEFAULT_BUTTONS,
  extraButtons = DEFAULT_EXTRA,
  gridColumns = 4,
  hasHistory = false,
  onButtonClick,
}: ActionButtonsProps) {
  const isDisabled = (btn: ButtonConfig) => {
    return btn.id === "undo" && !hasHistory;
  };

  return (
    <div className="action-card">
      <div className="card-grid" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
        {buttons.map((btn) => (
          <button
            key={btn.id}
            className={`card-btn ${btn.style} ${btn.id === "undo" && hasHistory ? "active" : ""}`}
            onClick={() => onButtonClick(btn)}
            disabled={isDisabled(btn)}
          >
            {btn.label}
          </button>
        ))}
      </div>
      {extraButtons && extraButtons.length > 0 && (
        <div className="card-grid" style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}>
          {extraButtons.map((btn) => (
            <button
              key={btn.id}
              className={`card-btn ${btn.style}`}
              onClick={() => onButtonClick(btn)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
