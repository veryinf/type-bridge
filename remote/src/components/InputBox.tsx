import { forwardRef, useImperativeHandle, useRef, useState, useEffect, KeyboardEvent } from "react";
import { Maximize2, ClipboardList, Maximize, HelpCircle, Eraser } from "lucide-react";
import { ButtonConfig } from "../types/layout";
import { useLongPress } from "../hooks/useLongPress";

interface InputBoxProps {
  buttons: ButtonConfig[];
  syncValue?: string;
  onChange?: (value: string) => void;
  onButtonClick: (button: ButtonConfig) => void;
  onShowHelp?: (text: string) => void;
}

export interface InputBoxHandle {
  focus: () => void;
  getTextArea: () => HTMLTextAreaElement | null;
}

const ICON_BUTTONS: ButtonConfig[] = [
  { id: "clear", label: "清空", icon: <Eraser size={16} />, help: "清空输入框内容" },
  { id: "expand", label: "更大", icon: <Maximize2 size={16} />, help: "展开全屏编辑器" },
  { id: "history", label: "历史", icon: <ClipboardList size={16} />, help: "查看发送历史记录" },
  { id: "fullscreen", label: "全屏", icon: <Maximize size={16} />, help: "切换全屏模式" },
  { id: "help", label: "帮助", icon: <HelpCircle size={16} />, help: "长按查看帮助" },
];

const InputBox = forwardRef<InputBoxHandle, InputBoxProps>(
  ({ buttons, syncValue, onChange, onButtonClick, onShowHelp }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [charCount, setCharCount] = useState(0);
    const longPress = useLongPress((text) => onShowHelp?.(text));

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      getTextArea: () => textareaRef.current,
    }));

    // 从外部同步值（来自 ExpandModal 或历史记录）
    useEffect(() => {
      if (textareaRef.current && syncValue !== undefined && textareaRef.current.value !== syncValue) {
        textareaRef.current.value = syncValue;
        setCharCount(syncValue.length);
      }
    }, [syncValue]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const sendBtn = buttons.find((b) => b.id === "send");
        const submitBtn = buttons.find((b) => b.id === "submit");
        const text = textareaRef.current?.value.trim() ?? "";
        if (text && sendBtn) {
          onButtonClick(sendBtn);
        } else if (!text && submitBtn) {
          onButtonClick(submitBtn);
        }
      }
    };

    const handleInput = () => {
      const value = textareaRef.current?.value ?? "";
      setCharCount(value.length);
      onChange?.(value);
    };

    const handlePointerDown = (btn: ButtonConfig) => {
      longPress.start(btn.help);
    };

    const handleClick = (btn: ButtonConfig) => {
      if (longPress.release()) return;
      onButtonClick(btn);
    };

    return (
      <div className="input-card">
        {/* Row 1: 输入框 */}
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="请输入内容..."
          />
        </div>

        {/* Row 2: 字数(左) + icon按钮(右) */}
        <div className="input-meta">
          <span className="char-count">{charCount} 字</span>
          <div className="input-icon-btns">
            {ICON_BUTTONS.map((btn) => (
              <button
                key={btn.id}
                className="input-btn icon"
                title={btn.label}
                onPointerDown={() => handlePointerDown(btn)}
                onClick={() => handleClick(btn)}
                onPointerLeave={() => longPress.stop()}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: JSON 定义的按钮 */}
        <div className="input-btns">
          {(() => {
            const rows: ButtonConfig[][] = [];
            for (let i = 0; i < buttons.length; i += 4) {
              rows.push(buttons.slice(i, i + 4));
            }
            return rows.map((row, ri) => (
              <div key={ri} className="input-btn-row">
                {row.map((btn) => (
                  <button
                    key={btn.id}
                    className={`input-btn btn-${btn.variant ?? "secondary"}`}
                    onPointerDown={() => handlePointerDown(btn)}
                    onClick={() => handleClick(btn)}
                    onPointerLeave={() => longPress.stop()}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            ));
          })()}
        </div>
      </div>
    );
  }
);

InputBox.displayName = "InputBox";
export default InputBox;
