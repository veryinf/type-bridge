import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import InputBox, { InputBoxHandle } from "../components/InputBox";
import ActionButtons from "../components/ActionButtons";
import ExpandModal from "../components/ExpandModal";
import HistoryModal, { saveToHistory } from "../components/HistoryModal";
import HelpModal from "../components/HelpModal";
import HelpPopover from "../components/HelpPopover";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import { ButtonConfig, LayoutConfig } from "../types/layout";

export default function ConsolePage() {
  const [hasHistory, setHasHistory] = useState(false);
  const [isExpandOpen, setIsExpandOpen] = useState(false);
  const [consoleText, setConsoleText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutConfig | null>(null);
  const [helpText, setHelpText] = useState<string | undefined>();
  const [helpPopoverText, setHelpPopoverText] = useState<string | null>(null);
  const inputRef = useRef<InputBoxHandle>(null);
  const lastSentRef = useRef<string>("");
  const { execute, getConsoleConfig } = useApi();
  const toast = useToast();

  useEffect(() => {
    getConsoleConfig().then((config) => {
      setLayout(config);
      setHelpText(config.help_text);
    });
  }, [getConsoleConfig]);

  const handleShowHelp = useCallback((text: string) => {
    setHelpPopoverText(text);
  }, []);

  async function handleButtonClick(button: ButtonConfig) {
    if (button.requireInput && !consoleText.trim()) {
      toast.warning("请先输入内容");
      return;
    }

    switch (button.id) {
      case "expand":
        setIsExpandOpen(true);
        return;
      case "collapse":
        setIsExpandOpen(false);
        return;
      case "clear":
        setConsoleText("");
        return;
      case "history":
        setIsHistoryOpen(true);
        return;
      case "fullscreen":
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else {
            await document.documentElement.requestFullscreen();
          }
        } catch {
          // 静默处理
        }
        return;
      case "help":
        setIsHelpOpen(true);
        return;
    }

    if (button.commands) {
      const commands = button.commands.map((cmd) => ({
        ...cmd,
        text: cmd.text?.replace("{{input}}", consoleText),
      }));
      await execute(commands);

      if (button.commands.some((cmd) => cmd.action === "text")) {
        lastSentRef.current = consoleText;
        saveToHistory(consoleText);
        setHasHistory(true);
        setConsoleText("");
        setIsExpandOpen(false);
      } else {
        setHasHistory(true);
      }
    }
  }

  const handleHistorySelect = useCallback((text: string) => {
    setConsoleText(text);
    setIsHistoryOpen(false);
  }, []);

  if (!layout) return <div className="page console-page" />;

  return (
    <div className="page console-page">
      <InputBox
        ref={inputRef}
        buttons={layout.inputButtons}
        syncValue={consoleText}
        onChange={setConsoleText}
        onButtonClick={handleButtonClick}
        onShowHelp={handleShowHelp}
      />
      <ActionButtons
        groups={layout.actionGroups}
        hasHistory={hasHistory}
        onButtonClick={handleButtonClick}
        onShowHelp={handleShowHelp}
      />
      {isExpandOpen && createPortal(
        <ExpandModal
          buttons={layout.inputButtons.slice(0, 4)}
          value={consoleText}
          onChange={setConsoleText}
          onAction={handleButtonClick}
          onClose={() => setIsExpandOpen(false)}
        />,
        document.body
      )}
      {isHistoryOpen && createPortal(
        <HistoryModal
          onSelect={handleHistorySelect}
          onClose={() => setIsHistoryOpen(false)}
        />,
        document.body
      )}
      {isHelpOpen && createPortal(
        <HelpModal
          helpText={helpText}
          onClose={() => setIsHelpOpen(false)}
        />,
        document.body
      )}
      {helpPopoverText !== null && createPortal(
        <HelpPopover
          text={helpPopoverText}
          onClose={() => setHelpPopoverText(null)}
        />,
        document.body
      )}
    </div>
  );
}
