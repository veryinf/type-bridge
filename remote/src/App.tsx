import { useState, useRef, useCallback } from "react";
import InputBox, { InputBoxHandle } from "./components/InputBox";
import ActionButtons from "./components/ActionButtons";
import CursorButtons from "./components/CursorButtons";
import SymbolButtons from "./components/SymbolButtons";
import SymbolModal from "./components/SymbolModal";
import { useApi } from "./hooks/useApi";

export default function App() {
  const [hasHistory, setHasHistory] = useState(false);
  const [symbolPair, setSymbolPair] = useState<string | null>(null);
  const inputRef = useRef<InputBoxHandle>(null);
  const { sendText, sendEnter, undo, moveCursor, deletePC } = useApi();

  const handleSend = useCallback(
    async (text?: string) => {
      const value = text ?? inputRef.current?.getValue().trim() ?? "";
      if (!value) return;
      await sendText(value);
      setHasHistory(true);
      inputRef.current?.clear();
    },
    [sendText]
  );

  const handleEnter = useCallback(async () => {
    await sendEnter();
    setHasHistory(true);
  }, [sendEnter]);

  const handleUndo = useCallback(async () => {
    const data = await undo();
    if (data.status === "success") {
      inputRef.current?.setValue(data.content || "");
      setHasHistory(false);
    }
  }, [undo]);

  const handleClear = useCallback(() => {
    inputRef.current?.clear();
  }, []);

  const handleCursorMove = useCallback(
    async (direction: string) => {
      await moveCursor(direction);
      setHasHistory(false);
    },
    [moveCursor]
  );

  const handleDelete = useCallback(async () => {
    await deletePC();
    setHasHistory(false);
  }, [deletePC]);

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

  return (
    <>
      <InputBox
        ref={inputRef}
        onSend={(text) => handleSend(text)}
        onEnter={handleEnter}
        onDelete={handleDelete}
      />
      <div className="flex-1 w-full px-4 py-2 flex flex-col gap-2 overflow-y-auto pb-[max(20px,env(safe-area-inset-bottom))]">
        <ActionButtons
          hasHistory={hasHistory}
          onSend={() => handleSend()}
          onEnter={handleEnter}
          onUndo={handleUndo}
          onClear={handleClear}
        />
        <CursorButtons onMove={handleCursorMove} />
        <SymbolButtons onOpen={setSymbolPair} />
      </div>
      {symbolPair && (
        <SymbolModal
          symbol={symbolPair}
          onConfirm={handleSymbolConfirm}
          onClose={() => setSymbolPair(null)}
        />
      )}
    </>
  );
}
