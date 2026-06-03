import { ConsoleConfig, Command } from "../types/layout";
import defaultConfig from "../../../console.json";

const MOCK_CONFIG = defaultConfig as unknown as ConsoleConfig;

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export async function mockGetConsoleConfig(): Promise<ConsoleConfig> {
  await delay();
  return MOCK_CONFIG;
}

export async function mockExecute(commands: Command[]): Promise<{ status: string }> {
  await delay();
  for (const cmd of commands) {
    switch (cmd.action) {
      case "text":
        console.log(`[Mock] 发送文本: "${cmd.text}"`);
        break;
      case "key":
        console.log(`[Mock] 按键: ${cmd.key}`);
        break;
      case "combo":
        console.log(`[Mock] 组合键: ${cmd.keys?.join("+")}`);
        break;
      case "undo":
        console.log("[Mock] 撤销");
        break;
      case "delay":
        console.log(`[Mock] 延迟: ${cmd.ms}ms`);
        break;
    }
  }
  return { status: "ok" };
}
