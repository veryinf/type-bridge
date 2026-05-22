import { ConsoleConfig, Command } from "../types/layout";

const MOCK_CONFIG: ConsoleConfig = {
  help_text: "## 使用帮助\n\n- **发送**：将输入框内容发送到电脑\n- **回车**：发送回车键\n- **提交**：发送内容并回车\n- **更大**：打开全屏编辑器\n- **清空**：清空输入框\n- **历史**：查看发送历史\n- **全屏**：切换全屏模式\n- **帮助**：显示此帮助",
  rules: [],
  inputButtons: [
    { id: "send", label: "发送", style: "send", commands: [{ action: "text", text: "{{input}}", applyRules: true }] },
    { id: "enter", label: "回车", style: "enter", commands: [{ action: "key", key: "enter" }] },
    { id: "submit", label: "提交", style: "submit", commands: [{ action: "text", text: "{{input}}", applyRules: true }, { action: "key", key: "enter" }] },
    { id: "clear", label: "清空", style: "clear", clientAction: "clear" },
    { id: "expand", label: "更大", style: "expand", icon: "⤢", clientAction: "expand" },
    { id: "history", label: "历史", style: "history", icon: "📋", clientAction: "history" },
    { id: "fullscreen", label: "全屏", style: "fullscreen", icon: "⛶", clientAction: "fullscreen" },
    { id: "help", label: "帮助", style: "help", icon: "?", clientAction: "help" },
  ],
  actionButtons: [
    { id: "left", label: "←", style: "cursor", commands: [{ action: "key", key: "left" }] },
    { id: "up", label: "↑", style: "cursor", commands: [{ action: "key", key: "up" }] },
    { id: "down", label: "↓", style: "cursor", commands: [{ action: "key", key: "down" }] },
    { id: "right", label: "→", style: "cursor", commands: [{ action: "key", key: "right" }] },
    { id: "delete", label: "删除", style: "delete", commands: [{ action: "key", key: "backspace" }] },
    { id: "undo", label: "撤销", style: "undo", commands: [{ action: "undo" }] },
    { id: "resend", label: "上次", style: "resend", clientAction: "resend" },
    { id: "symbol1", label: "（）", style: "symbol", clientAction: "symbol", params: "()" },
  ],
  extraActionButtons: [
    { id: "symbol2", label: '""', style: "symbol", clientAction: "symbol", params: '""' },
    { id: "symbol3", label: "「」", style: "symbol", clientAction: "symbol", params: "「」" },
    { id: "symbol4", label: "[]", style: "symbol", clientAction: "symbol", params: "[]" },
  ],
  gridColumns: 4,
};

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
