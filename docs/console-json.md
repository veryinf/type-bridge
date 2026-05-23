# Console JSON 配置指南

Console JSON 是 Type Bridge 手机端界面的核心配置文件，用于定义按钮布局、快捷指令、正则替换规则等。通过修改此文件，可以完全自定义手机端的操作界面。

## 配置文件位置

- **默认配置**：`default_console.json`（项目根目录，随应用打包，不可修改）
- **用户配置**：首次运行时自动复制到 `%APPDATA%/TypeBridge/console.json`（可自由修改）

用户配置存在时优先使用，删除后恢复默认配置。

---

## 顶层结构

```jsonc
{
  "help_text": "帮助文档（Markdown 格式）",
  "inputButtons": [ /* 输入区域按钮 */ ],
  "actionGroups": [ /* 功能按钮组 */ ],
  "rules": [ /* 正则替换规则 */ ]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `help_text` | `string` | 否 | 帮助弹窗内容，支持 Markdown |
| `inputButtons` | `ButtonConfig[]` | 是 | 输入区域按钮（发送、回车等） |
| `actionGroups` | `ActionGroup[]` | 是 | 功能按钮分组（光标、符号等） |
| `rules` | `RuleConfig[]` | 否 | 正则替换规则列表 |

---

## ButtonConfig（按钮配置）

每个按钮都是一个 `ButtonConfig` 对象：

```jsonc
{
  "id": "send",           // 唯一标识符
  "label": "发送",        // 按钮显示文字
  "variant": "primary",   // 按钮风格
  "help": "长按提示文字",  // 长按弹出的帮助说明
  "commands": [           // 指令列表（发送到电脑执行）
    { "action": "text", "text": "{{input}}", "applyRules": true }
  ],
  "requireInput": true     // 是否要求输入框非空
}
```

### 核心字段说明

#### `id`（必填）

按钮的唯一标识符。部分特殊 id 有内置行为：

| id | 内置行为 |
|----|----------|
| `expand` | 打开全屏编辑弹窗 |
| `history` | 打开历史记录弹窗 |
| `fullscreen` | 切换浏览器全屏模式 |
| `help` | 打开帮助弹窗 |
| `clear` | 清空输入框 |

> 内置行为由应用自动处理，不需要配置 `commands`。这些按钮通常由应用内部定义，不建议在 JSON 中重复配置。

#### `label`（必填）

按钮上显示的文字，支持 emoji 和特殊符号，如 `"←"`、`"（）"`。

#### `variant`（可选，默认 `"secondary"`）

按钮的视觉风格，决定颜色。可选值：

| variant | 颜色 | 用途 |
|---------|------|------|
| `primary` | 🟢 绿色 | 主要操作（发送、提交） |
| `info` | 🔵 蓝色 | 辅助信息操作（回车、提问） |
| `danger` | 🔴 红色 | 危险操作（删除、清空） |
| `secondary` | ⚪ 灰色 | 默认/次要操作（撤销） |
| `cursor` | ⬛ 深灰 | 方向键（← → ↑ ↓） |
| `symbol` | 🟣 紫色 | 符号包裹操作 |
| `white` | ⬜ 白色 | 扩展弹窗顶部按钮 |

#### `commands`（可选）

指令列表，点击按钮后发送到电脑执行。支持的 action 类型：

**`text`** — 输入文本

```jsonc
{ "action": "text", "text": "要发送的文字" }
```

- 使用 `{{input}}` 占位符引用输入框内容
- 设置 `"applyRules": true` 启用正则替换规则

```jsonc
// 发送输入框内容，经过正则替换
{ "action": "text", "text": "{{input}}", "applyRules": true }

// 发送固定文本
{ "action": "text", "text": "/compress" }

// 用括号包裹输入内容后发送
{ "action": "text", "text": "({{input}})" }
```

**`key`** — 按键操作

```jsonc
{ "action": "key", "key": "enter" }    // 回车
{ "action": "key", "key": "backspace" } // 退格
{ "action": "key", "key": "left" }      // 光标左移
{ "action": "key", "key": "up" }        // 光标上移
{ "action": "key", "key": "down" }      // 光标下移
{ "action": "key", "key": "right" }     // 光标右移
```

**`combo`** — 组合键

```jsonc
{ "action": "combo", "keys": ["ctrl", "a"] }  // Ctrl+A
{ "action": "combo", "keys": ["ctrl", "z"] }  // Ctrl+Z
```

**`undo`** — 撤销

```jsonc
{ "action": "undo" }  // 撤销上一次发送
```

**`delay`** — 延迟

```jsonc
{ "action": "delay", "ms": 500 }  // 延迟 500 毫秒
```

**指令按顺序执行**，一条按钮可包含多条指令。例如"发送并回车"：

```jsonc
"commands": [
  { "action": "text", "text": "{{input}}", "applyRules": true },
  { "action": "key", "key": "enter" }
]
```

> 包含 `text` 指令的按钮，执行后会自动保存到历史记录并清空输入框。

#### `requireInput`（可选，默认 `false`）

设为 `true` 时，点击按钮前检查输入框是否有内容。为空时弹出提示，不执行指令。

---

## ActionGroup（按钮分组）

将功能按钮按组组织：

```jsonc
{
  "title": "光标控制",   // 分组标题
  "columns": 4,         // 网格列数（可选，默认 4）
  "buttons": [          // 按钮数组
    { "id": "left", "label": "←", "variant": "cursor", "commands": [...] },
    ...
  ]
}
```

### `columns` 列数

控制按钮排列的网格列数。按钮会自动按列数换行：

- `1`：单列纵向排列
- `2`：两列排列（适合较大按钮）
- `4`：四列排列（适合小按钮，如方向键）

---

## RuleConfig（正则替换规则）

`rules` 数组定义文本替换规则，`{{input}}` 中的文本发送到电脑前会依次应用：

```jsonc
{
  "pattern": "毫安时",      // 正则表达式
  "replacement": "mAh",    // 替换文本
  "enabled": true           // 是否启用
}
```

### 规则示例

```jsonc
// 简单文本替换
{ "pattern": "毫安时", "replacement": "mAh", "enabled": true }

// 正则表达式捕获组
{ "pattern": "(艾特)\\s*(QQ)\\s*点", "replacement": "@qq.", "enabled": true }

// 使用捕获组引用
{ "pattern": "(艾特)\\s*(\\w+)\\s*(点)\\s*(\\w+)", "replacement": "@\\2.\\4", "enabled": true }
// 输入："艾特 QQ 点 com" → 输出："@qq.com"
```

规则按数组顺序依次执行，设置 `"enabled": false` 可临时禁用某条规则。

---

## 完整示例

### 最简按钮

只需 `id`、`label` 和一个执行动作：

```jsonc
{ "id": "enter", "label": "回车", "variant": "info", "commands": [{ "action": "key", "key": "enter" }] }
```

### 带占位符的按钮

使用 `{{input}}` 引用输入框内容：

```jsonc
{
  "id": "send",
  "label": "发送",
  "variant": "primary",
  "help": "将输入框文本发送到电脑",
  "commands": [{ "action": "text", "text": "{{input}}", "applyRules": true }]
}
```

### 多指令按钮

一条按钮执行多条指令，按顺序依次执行：

```jsonc
{
  "id": "submit",
  "label": "提交",
  "variant": "info",
  "help": "发送文本并自动回车",
  "commands": [
    { "action": "text", "text": "{{input}}", "applyRules": true },
    { "action": "key", "key": "enter" }
  ]
}
```

### 需要输入的按钮

```jsonc
{
  "id": "btw",
  "label": "提问",
  "variant": "info",
  "requireInput": true,
  "help": "使用输入框内容发送 /btw 指令",
  "commands": [
    { "action": "text", "text": "/btw {{input}}" },
    { "action": "key", "key": "enter" }
  ]
}
```

### 符号包裹按钮

使用 `{{input}}` 占位符将输入内容包裹在符号中：

```jsonc
{ "id": "symbol1", "label": "（）", "variant": "symbol", "commands": [{ "action": "text", "text": "({{input}})" }] }
{ "id": "symbol2", "label": "\"\"", "variant": "symbol", "commands": [{ "action": "text", "text": "\"{{input}}\"" }] }
{ "id": "symbol3", "label": "「」", "variant": "symbol", "commands": [{ "action": "text", "text": "「{{input}}」" }] }
{ "id": "symbol4", "label": "[]", "variant": "symbol", "commands": [{ "action": "text", "text": "[{{input}}]" }] }
```

---

## 内置功能

以下功能由应用内置提供，无需在 JSON 中配置：

| 功能 | 说明 |
|------|------|
| 全屏编辑 | 点击输入框旁的"更大"按钮，打开全屏编辑弹窗 |
| 历史记录 | 点击"历史"按钮，查看并重新发送之前的内容 |
| 全屏模式 | 点击"全屏"按钮，切换浏览器全屏显示 |
| 帮助 | 点击"帮助"按钮或长按任意按钮查看说明 |

---

## 注意事项

- **字段兼容**：JSON 中多余的字段会被忽略，缺少可选字段使用默认值，不会报错
- **`{{input}}` 占位符**：仅在 `text` 指令的 `text` 字段中生效，替换为输入框当前内容
- **自动行为**：包含 `text` 指令的按钮执行后，会自动保存历史记录并清空输入框
- **正则语法**：`rules` 中的 `pattern` 使用 JavaScript 正则表达式语法
- **特殊字符转义**：JSON 中反斜杠需双写，如 `\\s` 表示正则的 `\s`
- **修改后**：重新打开手机页面即生效，无需重启应用
