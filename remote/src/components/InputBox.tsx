import { forwardRef, useImperativeHandle, useRef, KeyboardEvent } from "react";

interface InputBoxProps {
  onSend: (text: string) => void;
  onEnter: () => void;
  onDelete: () => void;
}

export interface InputBoxHandle {
  getValue: () => string;
  setValue: (v: string) => void;
  clear: () => void;
  getTextArea: () => HTMLTextAreaElement | null;
}

const InputBox = forwardRef<InputBoxHandle, InputBoxProps>(
  ({ onSend, onEnter, onDelete }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      getValue: () => textareaRef.current?.value ?? "",
      setValue: (v: string) => {
        if (textareaRef.current) textareaRef.current.value = v;
      },
      clear: () => {
        if (textareaRef.current) textareaRef.current.value = "";
      },
      getTextArea: () => textareaRef.current,
    }));

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const text = textareaRef.current?.value.trim();
        text ? onSend(text) : onEnter();
      }
      if (e.key === "Backspace") {
        const text = textareaRef.current?.value.trim();
        if (!text) {
          e.preventDefault();
          onDelete();
        }
      }
    };

    return (
      <div className="w-full p-4 pb-2">
        <textarea
          ref={textareaRef}
          onKeyDown={handleKeyDown}
          placeholder="请输入内容，随后按回车键发送..."
          className="w-full h-[120px] p-3 border-2 border-[var(--color-primary)] rounded-[10px] resize-none text-base font-inherit focus:outline-none focus:border-[var(--color-primary-dark)]"
        />
      </div>
    );
  }
);

InputBox.displayName = "InputBox";
export default InputBox;
