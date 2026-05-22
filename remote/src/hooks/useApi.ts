import { useCallback } from "react";
import { Command, ConsoleLayout } from "../types/layout";

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

  const getLayouts = useCallback(async (): Promise<ConsoleLayout[]> => {
    const res = await fetch(`${BASE_URL}/layouts`);
    return res.json();
  }, []);

  const getLayout = useCallback(async (id: number): Promise<ConsoleLayout> => {
    const res = await fetch(`${BASE_URL}/layouts/${id}`);
    return res.json();
  }, []);

  const getDefaultLayout = useCallback(async (): Promise<ConsoleLayout | null> => {
    const layouts = await getLayouts();
    return layouts.find((l) => l.is_default) || layouts[0] || null;
  }, [getLayouts]);

  return {
    execute,
    sendText,
    sendEnter,
    sendCombo,
    undo,
    moveCursor,
    deletePC,
    getTemplates,
    getLayouts,
    getLayout,
    getDefaultLayout,
  };
}
