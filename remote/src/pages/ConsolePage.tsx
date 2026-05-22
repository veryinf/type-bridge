import { useState, useRef, useCallback, useEffect } from "react";
import InputBox, { InputBoxHandle } from "../components/InputBox";
import ActionButtons from "../components/ActionButtons";
import SymbolModal from "../components/SymbolModal";
import ExpandModal from "../components/ExpandModal";
import { useApi } from "../hooks/useApi";
import { ButtonConfig, ConsoleLayout, LayoutConfig } from "../types/layout";

export default function ConsolePage() {
  const [hasHistory, setHasHistory] = useState(false);
  const [symbolPair, setSymbolPair] = useState<string | null>(null);
  const [isExpandOpen, setIsExpandOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutConfig | null>(null);
  const inputRef = useRef<InputBoxHandle>(null);
  const lastSentRef = useRef<string>("");
  const { execute, getDefaultLayout } = useApi();

  useEffect(() => {
    getDefaultLayout().then((l) => {
      if (l) {
        setLayout(l.config);
      }
    });
  }, [getDefaultLayout]);

  const processCommands = useCallback(
    async (buttons: ButtonConfig[]) => {
      for (const btn of buttons) {
        if (!btn.commands) continue;
        // 替换 {{input}} 变量
        const inputText = inputRef.current?.getValue() ?? "";
        const commands = btn.commands.map((cmd) => ({
          ...cmd,
          text: cmd.text?.replace("{{input}}", inputText),
        }));
        await execute(commands);
      }
    },
    [execute]
  );

  const handleButtonClick = useCallback(
    async (button: ButtonConfig) => {
      // 客户端动作
      if (button.clientAction) {
        switch (button.clientAction) {
          case "expand":
            setIsExpandOpen(true);
            break;
          case "clear":
            inputRef.current?.clear();
            break;
          case "resend":
            if (lastSentRef.current) {
              const commands = [{ action: "text" as const, text: lastSentRef.current, applyRules: true }];
              await execute(commands);
              setHasHistory(true);
            }
            break;
          case "symbol":
            if (button.params) {
              setSymbolPair(button.params);
            }
            break;
        }
        return;
      }

      // 命令动作
      if (button.commands) {
        const inputText = inputRef.current?.getValue() ?? "";
        const commands = button.commands.map((cmd) => ({
          ...cmd,
          text: cmd.text?.replace("{{input}}", inputText),
        }));
        await execute(commands);

        // 记录历史
        if (button.id === "send" || button.id === "submit") {
          lastSentRef.current = inputText;
          setHasHistory(true);
          inputRef.current?.clear();
        }
        if (button.id === "enter" || button.id === "undo") {
          setHasHistory(true);
        }
      }
    },
    [execute]
  );

  const handleSymbolConfirm = useCallback((text: string) => {
    const textarea = inputRef.current?.getTextArea();
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    textarea.value = value.substring(0, start) + text + value.substring(end);
    const newPos = start + text.length;
    textarea.selectionStart = newPos;
    textarea.selectionEnd = newPos;
    textarea.focus();
    setSymbolPair(null);
  }, []);

  const handleExpandSend = useCallback(
    async (text: string) => {
      if (!text) return;
      lastSentRef.current = text;
      await execute([{ action: "text", text, applyRules: true }]);
      setHasHistory(true);
      setIsExpandOpen(false);
      inputRef.current?.clear();
    },
    [execute]
  );

  const handleExpandSubmit = useCallback(
    async (text: string) => {
      if (text) {
        lastSentRef.current = text;
        await execute([{ action: "text", text, applyRules: true }]);
      }
      await execute([{ action: "key", key: "enter" }]);
      setHasHistory(true);
      setIsExpandOpen(false);
      inputRef.current?.clear();
    },
    [execute]
  );

  const currentValue = inputRef.current?.getValue() ?? "";

  return (
    <div className="page console-page">
      <InputBox
        ref={inputRef}
        buttons={layout?.inputButtons}
        onButtonClick={handleButtonClick}
      />
      <ActionButtons
        buttons={layout?.actionButtons}
        extraButtons={layout?.extraActionButtons}
        gridColumns={layout?.gridColumns}
        hasHistory={hasHistory}
        onButtonClick={handleButtonClick}
      />
      {symbolPair && (
        <SymbolModal
          symbol={symbolPair}
          onConfirm={handleSymbolConfirm}
          onClose={() => setSymbolPair(null)}
        />
      )}
      {isExpandOpen && (
        <ExpandModal
          initialValue={currentValue}
          onSend={handleExpandSend}
          onSubmit={handleExpandSubmit}
          onClose={() => setIsExpandOpen(false)}
        />
      )}
    </div>
  );
}
