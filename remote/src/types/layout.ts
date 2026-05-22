export interface Command {
  action: "text" | "key" | "combo" | "undo" | "delay";
  text?: string;
  key?: string;
  keys?: string[];
  applyRules?: boolean;
  ms?: number;
}

export type ClientAction = "expand" | "clear" | "resend" | "symbol";

export interface ButtonConfig {
  id: string;
  label: string;
  style: string;
  commands?: Command[];
  clientAction?: ClientAction;
  params?: string;
}

export interface LayoutConfig {
  inputButtons: ButtonConfig[];
  actionButtons: ButtonConfig[];
  extraActionButtons?: ButtonConfig[];
  gridColumns?: number;
}

export interface ConsoleLayout {
  id: number;
  name: string;
  description: string;
  author: string;
  help_text: string;
  is_default: boolean;
  config: LayoutConfig;
  created_at: string;
  updated_at: string;
}
