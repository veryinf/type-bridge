export interface Command {
  action: "text" | "key" | "combo" | "undo" | "delay";
  text?: string;
  key?: string;
  keys?: string[];
  applyRules?: boolean;
  ms?: number;
}

export interface ButtonConfig {
  id: string;
  label: string;
  variant?: string;
  icon?: React.ReactNode;
  commands?: Command[];
  help?: string;
  requireInput?: boolean;
}

export interface ActionGroup {
  title: string;
  columns?: number;
  buttons: ButtonConfig[];
}

export interface LayoutConfig {
  inputButtons: ButtonConfig[];
  actionGroups: ActionGroup[];
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
