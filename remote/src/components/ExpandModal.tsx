import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { Eraser, Minimize2, ClipboardList } from "lucide-react";
import { ButtonConfig } from "../types/layout";
import { useLongPress } from "../hooks/useLongPress";

interface ExpandModalProps {
  buttons: ButtonConfig[];
  value: string;
  onChange: (value: string) => void;
  onAction: (button: ButtonConfig) => void;
  onClose: () => void;
  onShowHelp?: (text: string) => void;
}

export default function ExpandModal({
  buttons,
  value,
  onChange,
  onAction,
  onClose,
  onShowHelp,
}: ExpandModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [charCount, setCharCount] = useState(value.length);
  const syncingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPress = useLongPress((text) => onShowHelp?.(text));

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = value;
      textareaRef.current.focus();
    }
  }, []);

  // 从外部同步值（来自 InputBox）
  useEffect(() => {
    if (syncingRef.current) {
      syncingRef.current = false;
      return;
    }
    if (textareaRef.current && textareaRef.current.value !== value) {
      textareaRef.current.value = value;
      setCharCount(value.length);
    }
  }, [value]);

  // 动态调整高度以适配输入法
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !containerRef.current) return;

    const syncHeight = () => {
      if (containerRef.current) {
        containerRef.current.style.height = `${vv.height}px`;
        containerRef.current.style.top = `${vv.offsetTop}px`;
      }
    };

    syncHeight();
    vv.addEventListener("resize", syncHeight);
    vv.addEventListener("scroll", syncHeight);
    return () => {
      vv.removeEventListener("resize", syncHeight);
      vv.removeEventListener("scroll", syncHeight);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const sendBtn = buttons.find((b) => b.id === "send");
      const submitBtn = buttons.find((b) => b.id === "submit");
      const text = textareaRef.current?.value.trim() ?? "";
      if (text && sendBtn) {
        onAction(sendBtn);
      } else if (!text && submitBtn) {
        onAction(submitBtn);
      }
    }
  };

  const handleInput = () => {
    const newValue = textareaRef.current?.value ?? "";
    setCharCount(newValue.length);
    syncingRef.current = true;
    onChange(newValue);
  };

  const handlePointerDown = (btn: ButtonConfig) => {
    longPress.start(btn.help);
  };

  const handleClick = (btn: ButtonConfig) => {
    if (longPress.release()) return;
    onAction(btn);
  };

  const clearBtn: ButtonConfig = { id: "clear", label: "清空", help: "清空输入框内容" };
  const collapseBtn: ButtonConfig = { id: "collapse", label: "缩小", help: "关闭全屏编辑器" };
  const historyBtn: ButtonConfig = { id: "history", label: "历史", help: "查看发送历史记录" };

  return (
    <div className="expand-modal" ref={containerRef}>
      <div className="input-card">
        {/* Row 1: 输入框 */}
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="请输入内容..."
            autoFocus
          />
        </div>

        {/* Row 2: 字数(左) + icon按钮(右) */}
        <div className="input-meta">
          <span className="char-count">{charCount} 字</span>
          <div className="input-icon-btns">
            <button
              className="input-btn icon"
              title="清空"
              onPointerDown={() => handlePointerDown(clearBtn)}
              onClick={() => handleClick(clearBtn)}
              onPointerLeave={() => longPress.stop()}
            >
              <Eraser size={16} />
            </button>
            <button
              className="input-btn icon"
              title="缩小"
              onPointerDown={() => handlePointerDown(collapseBtn)}
              onClick={() => handleClick(collapseBtn)}
              onPointerLeave={() => longPress.stop()}
            >
              <Minimize2 size={16} />
            </button>
            <button
              className="input-btn icon"
              title="历史"
              onPointerDown={() => handlePointerDown(historyBtn)}
              onClick={() => handleClick(historyBtn)}
              onPointerLeave={() => longPress.stop()}
            >
              <ClipboardList size={16} />
            </button>
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
    </div>
  );
}
