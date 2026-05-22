import { forwardRef, useImperativeHandle, useRef, useState, KeyboardEvent } from "react";
import { ButtonConfig } from "../types/layout";

interface InputBoxProps {
  buttons?: ButtonConfig[];
  onButtonClick: (button: ButtonConfig) => void;
}

export interface InputBoxHandle {
  getValue: () => string;
  setValue: (v: string) => void;
  clear: () => void;
  getTextArea: () => HTMLTextAreaElement | null;
}

const DEFAULT_BUTTONS: ButtonConfig[] = [
  { id: "send", label: "发送", style: "send", commands: [{ action: "text", text: "{{input}}", applyRules: true }] },
  { id: "enter", label: "回车", style: "enter", commands: [{ action: "key", key: "enter" }] },
  { id: "submit", label: "提交", style: "submit", commands: [{ action: "text", text: "{{input}}", applyRules: true }, { action: "key", key: "enter" }] },
  { id: "clear", label: "清空", style: "clear", clientAction: "clear" },
  { id: "expand", label: "更大", style: "expand", icon: "⤢", clientAction: "expand" },
  { id: "history", label: "历史", style: "history", icon: "📋", clientAction: "history" },
  { id: "fullscreen", label: "全屏", style: "fullscreen", icon: "⛶", clientAction: "fullscreen" },
  { id: "help", label: "帮助", style: "help", icon: "?", clientAction: "help" },
];

const InputBox = forwardRef<InputBoxHandle, InputBoxProps>(
  ({ buttons = DEFAULT_BUTTONS, onButtonClick }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [charCount, setCharCount] = useState(0);

    useImperativeHandle(ref, () => ({
      getValue: () => textareaRef.current?.value ?? "",
      setValue: (v: string) => {
        if (textareaRef.current) {
          textareaRef.current.value = v;
          setCharCount(v.length);
        }
      },
      clear: () => {
        if (textareaRef.current) {
          textareaRef.current.value = "";
          setCharCount(0);
        }
      },
      getTextArea: () => textareaRef.current,
    }));

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // 查找发送或提交按钮
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
      setCharCount(textareaRef.current?.value.length || 0);
    };

    return (
      <div className="input-card">
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="请输入内容..."
          />
          <span className="char-count">{charCount} 字</span>
        </div>
        <div className="input-btns">
          {(() => {
            const rows: ButtonConfig[][] = [];
            for (let i = 0; i < buttons.length; i += 4) {
              rows.push(buttons.slice(i, i + 4));
            }
            return rows.map((row, ri) => (
              <div key={ri} className="input-btn-row">
                {row.map((btn) =>
                  btn.icon ? (
                    <button
                      key={btn.id}
                      className={`input-btn icon ${btn.style}`}
                      onClick={() => onButtonClick(btn)}
                      title={btn.label}
                    >
                      {btn.icon}
                    </button>
                  ) : (
                    <button
                      key={btn.id}
                      className={`input-btn ${btn.style}`}
                      onClick={() => onButtonClick(btn)}
                    >
                      {btn.label}
                    </button>
                  )
                )}
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
