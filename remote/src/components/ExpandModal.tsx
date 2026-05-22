import { useRef, useEffect, useState } from "react";

interface ExpandModalProps {
  initialValue?: string;
  onSend: (text: string) => void;
  onSubmit: (text: string) => void;
  onClose: () => void;
}

export default function ExpandModal({
  initialValue = "",
  onSend,
  onSubmit,
  onClose,
}: ExpandModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [charCount, setCharCount] = useState(initialValue.length);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = initialValue;
      textareaRef.current.focus();
    }
  }, [initialValue]);

  const getText = () => textareaRef.current?.value.trim() ?? "";

  const handleSend = () => {
    const text = getText();
    if (text) onSend(text);
  };

  const handleSubmit = () => {
    const text = getText();
    onSubmit(text);
  };

  const handleInput = () => {
    setCharCount(textareaRef.current?.value.length || 0);
  };

  return (
    <div className="expand-modal">
      <div className="expand-header">
        <span className="expand-title">编辑内容</span>
        <span className="expand-char-count">{charCount} 字</span>
        <button className="expand-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="expand-body">
        <textarea
          ref={textareaRef}
          onInput={handleInput}
          placeholder="请输入内容..."
          autoFocus
        />
      </div>
      <div className="expand-footer">
        <button className="expand-btn send" onClick={handleSend}>
          发送
        </button>
        <button className="expand-btn submit" onClick={handleSubmit}>
          提交
        </button>
      </div>
    </div>
  );
}
