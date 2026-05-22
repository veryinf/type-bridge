import { useCallback } from "react";
import { Command, ConsoleConfig } from "../types/layout";

const BASE_URL = "/api/v1";

async function execute(commands: Command[]) {
  const res = await fetch(`${BASE_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands }),
  });
  return res.json();
}

export function useApi() {
  const sendText = useCallback(async (text: string, applyRules = true) => {
    return execute([{ action: "text", text, applyRules }]);
  }, []);

  const sendEnter = useCallback(async () => {
    return execute([{ action: "key", key: "enter" }]);
  }, []);

  const sendCombo = useCallback(async (...keys: string[]) => {
    return execute([{ action: "combo", keys }]);
  }, []);

  const undo = useCallback(async () => {
    return execute([{ action: "undo" }]);
  }, []);

  const moveCursor = useCallback(async (direction: string) => {
    return execute([{ action: "key", key: direction }]);
  }, []);

  const deletePC = useCallback(async () => {
    return execute([{ action: "key", key: "backspace" }]);
  }, []);

  const getTemplates = useCallback(async () => {
    const res = await fetch(`${BASE_URL}/templates`);
    return res.json();
  }, []);

  const getConsoleConfig = useCallback(async (): Promise<ConsoleConfig> => {
    const res = await fetch(`${BASE_URL}/console`);
    return res.json();
  }, []);

  return {
    execute,
    sendText,
    sendEnter,
    sendCombo,
    undo,
    moveCursor,
    deletePC,
    getTemplates,
    getConsoleConfig,
  };
}
