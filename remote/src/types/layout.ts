export interface Command {
  action: "text" | "key" | "combo" | "undo" | "delay";
  text?: string;
  key?: string;
  keys?: string[];
  applyRules?: boolean;
  ms?: number;
}

export type ClientAction = "expand" | "clear" | "resend" | "symbol" | "history" | "fullscreen" | "help";

export interface ButtonConfig {
  id: string;
  label: string;
  style: string;
  icon?: string;
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

export interface RuleConfig {
  pattern: string;
  replacement: string;
  enabled: boolean;
}

export interface ConsoleConfig extends LayoutConfig {
  help_text: string;
  rules: RuleConfig[];
}
