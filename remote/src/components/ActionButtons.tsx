import { ActionGroup, ButtonConfig } from "../types/layout";
import { useLongPress } from "../hooks/useLongPress";

interface ActionButtonsProps {
  groups: ActionGroup[];
  hasHistory?: boolean;
  onButtonClick: (button: ButtonConfig) => void;
  onShowHelp?: (text: string) => void;
}

export default function ActionButtons({
  groups,
  hasHistory = false,
  onButtonClick,
  onShowHelp,
}: ActionButtonsProps) {
  const longPress = useLongPress((text) => onShowHelp?.(text));

  const isDisabled = (btn: ButtonConfig) => {
    if (btn.id === "undo" && !hasHistory) return true;
    return false;
  };

  const handlePointerDown = (btn: ButtonConfig) => {
    longPress.start(btn.help);
  };

  const handleClick = (btn: ButtonConfig) => {
    if (longPress.release()) return;
    onButtonClick(btn);
  };

  return (
    <>
      {groups.map((group, gi) => (
        <div key={gi} className="action-group">
          <span className="group-title">{group.title}</span>
          <div
            className="card-grid"
            style={{ gridTemplateColumns: `repeat(${group.columns ?? 4}, 1fr)` }}
          >
            {group.buttons.map((btn) => (
              <button
                key={btn.id}
                className={`card-btn btn-${btn.variant ?? "secondary"} ${btn.id === "undo" && hasHistory ? "active" : ""}`}
                disabled={isDisabled(btn)}
                onPointerDown={() => handlePointerDown(btn)}
                onClick={() => handleClick(btn)}
                onPointerLeave={() => longPress.stop()}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
