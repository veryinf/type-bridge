import { useCallback } from "react";
import { Command, ConsoleConfig } from "../types/layout";
import { mockExecute, mockGetConsoleConfig } from "../mock";

const BASE_URL = "/api/v1";
const USE_MOCK = import.meta.env.VITE_MOCK_API !== "false";

async function execute(commands: Command[]) {
  if (USE_MOCK) return mockExecute(commands);
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

  const getConsoleConfig = useCallback(async (): Promise<ConsoleConfig> => {
    if (USE_MOCK) return mockGetConsoleConfig();
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
    getConsoleConfig,
  };
}
