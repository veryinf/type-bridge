import { useCallback } from "react";

const BASE_URL = "";

async function post(path: string, body?: Record<string, string>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export function useApi() {
  const sendText = useCallback(async (text: string) => {
    return post("/send", { text });
  }, []);

  const sendEnter = useCallback(async () => {
    return post("/send_enter");
  }, []);

  const undo = useCallback(async () => {
    return post("/undo");
  }, []);

  const moveCursor = useCallback(async (direction: string) => {
    return post("/move_cursor", { direction });
  }, []);

  const deletePC = useCallback(async () => {
    return post("/delete_pc");
  }, []);

  return { sendText, sendEnter, undo, moveCursor, deletePC };
}
