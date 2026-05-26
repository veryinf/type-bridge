# 输入引擎架构设计

Type Bridge 的输入引擎负责将手机端发送的文本/按键操作传递到电脑端的目标窗口。引擎支持多种输入路线，可根据场景切换。

## 路线总览

| 路线 | 代号 | 状态 | 原理 | 前台/后台 | 兼容性 |
|------|------|------|------|-----------|--------|
| 剪贴板粘贴 | `clipboard` | ✅ 已实现 | 写入剪贴板 → 模拟 Ctrl+V → 恢复剪贴板 | 前台 | ⭐⭐⭐ 最广 |
| 消息投递 | `postmessage` | 📋 规划中 | 通过 `PostMessage` 将 `WM_CHAR` 等消息投递到目标窗口句柄 | 后台 | ⭐⭐ 部分应用 |
| UI 自动化 | `uiautomation` | 📋 规划中 | 通过微软 UI Automation COM 接口操作目标控件 | 后台 | ⭐⭐⭐ 较广 |

---

## 路线一：剪贴板粘贴（clipboard）

### 原理

1. 保存当前剪贴板内容
2. 将待输入文本写入系统剪贴板
3. 模拟 `Ctrl+V` 粘贴到焦点窗口
4. 恢复原始剪贴板内容

### 流程

```
手机端 → HTTP POST → 规则替换 → 保存剪贴板 → 写入剪贴板 → Ctrl+V → 恢复剪贴板
```

### 实现位置

- 入口：`app.go` — `SendText()` / `executeHandler()`
- 核心：`backend/automation/keyboard.go` — `PasteText()`
- 规则：`backend/automation/rules.go` — `ApplyRules()`

### 优点

- 实现简单，依赖少
- 兼容几乎所有支持粘贴的应用
- 对中文等 Unicode 字符原生支持

### 局限

- **必须前台焦点**：目标窗口必须在前台且获得输入焦点
- **剪贴板竞争**：粘贴与恢复之间存在短暂窗口期，其他程序可能读到临时内容
- **安全输入框**：密码框等安全控件通常禁止粘贴操作
- **撤销精度**：按 `len()`（字节数）计算回退长度，对多字节字符（中文 3 字节）会多删

### 适用场景

- 通用文本输入（聊天、编辑器、终端等）
- 不关心焦点切换的场景
- 对兼容性要求最高的场景

---

## 路线二：消息投递（postmessage）

### 原理

通过 Win32 API `PostMessageW` 将键盘消息直接投递到目标窗口句柄（HWND），无需切换焦点窗口。

### 关键 API

| API | 用途 |
|-----|------|
| `FindWindowW` / `EnumWindows` | 查找目标窗口句柄 |
| `PostMessageW(hwnd, WM_CHAR, char, 0)` | 投递单个字符（ASCII） |
| `PostMessageW(hwnd, WM_IME_CHAR, char, 0)` | 投递 Unicode/IME 字符 |
| `PostMessageW(hwnd, WM_KEYDOWN/UP, vk, 0)` | 投递按键事件 |

### 消息选择策略

```
输入字符
├── ASCII (< 0x80) → WM_CHAR
└── 非 ASCII        → WM_IME_CHAR
```

### 优点

- **真正后台**：不抢焦点，不干扰用户当前操作
- **零剪贴板污染**：不涉及剪贴板，无竞争问题
- **轻量**：纯消息投递，无额外进程/线程

### 局限

- **兼容性有限**：部分应用不响应 `PostMessage` 投递的消息
  - ✅ 记事本、cmd、传统 Win32 应用
  - ⚠️ 部分 Electron 应用（如 VS Code）
  - ❌ 浏览器输入框、游戏窗口
- **无法发送组合键**：`Ctrl+C` 等组合键需要额外处理（`WM_KEYDOWN` + 修饰键状态）
- **窗口查找**：需要用户指定或自动识别目标窗口

### 适用场景

- 需要后台静默输入的场景
- 目标为传统 Win32 应用（记事本、Office 等）
- 不希望切换焦点打断用户工作

---

## 路线三：UI 自动化（uiautomation）

### 原理

通过微软 UI Automation (UIA) COM 接口，直接操作目标窗口中的文本控件，设置其 `Value.Value` 属性。

### 关键接口

| 接口 | 用途 |
|------|------|
| `IUIAutomation` | 自动化根接口，用于查找窗口/控件 |
| `IUIAutomationElement` | 表示一个 UI 元素（窗口、按钮、输入框） |
| `IUIAutomationValuePattern` | 读写控件的文本值 |
| `CoCreateInstance` | 创建 COM 自动化对象 |

### 流程

```
手机端 → HTTP POST → 规则替换
                      ↓
              查找目标窗口/控件 (FindWindow / IUIAutomation)
                      ↓
              获取 ValuePattern 接口
                      ↓
              设置 Value (目标控件直接接收文本)
```

### 优点

- **真正后台**：不抢焦点
- **兼容性较好**：支持大多数遵循 UIA 标准的现代应用
- **可精确定位控件**：能识别输入框、编辑区等具体控件，而非仅窗口级别
- **支持读取**：除输入外，还可读取目标控件的当前文本

### 局限

- **实现复杂**：需要 COM 初始化、接口查询、内存管理，代码量大
- **不支持所有应用**：部分应用（游戏、自绘 UI）未实现 UIA 接口
- **性能开销**：COM 调用比纯消息投递开销更大
- **窗口查找**：仍需解决"向哪个窗口输入"的问题

### 适用场景

- 需要后台输入且目标应用兼容 UIA（WPF、WinForms、UWP、部分 Electron）
- 需要精确控件级操作（如区分多个输入框）
- 未来可能扩展为"读取+写入"双向自动化

---

## 路线切换机制（规划）

### 用户配置

计划在设置中提供输入路线选择：

```jsonc
{
  "inputEngine": "clipboard"  // 可选值：clipboard | postmessage | uiautomation
}
```

### 自动回退（规划）

当所选路线失败时，可自动降级：

```
postmessage 失败 → 降级到 clipboard
uiautomation 失败 → 降级到 postmessage → 降级到 clipboard
```

### 接口抽象（规划）

统一输入接口，上层调用不感知底层实现：

```go
// 输入引擎统一接口
type InputEngine interface {
    // 输入文本到目标窗口
    TypeText(hwnd uintptr, text string) error
    // 发送按键到目标窗口
    SendKey(hwnd uintptr, key string) error
    // 发送组合键到目标窗口
    SendCombo(hwnd uintptr, keys ...string) error
    // 引擎名称
    Name() string
}

// 三种实现
type ClipboardEngine struct{}     // 剪贴板粘贴
type PostMessageEngine struct{}   // 消息投递
type UIAutomationEngine struct{}  // UI 自动化
```

### 当前状态

| 项目 | 状态 |
|------|------|
| 接口定义 | 📋 未开始 |
| ClipboardEngine 实现 | ✅ 已有代码，待抽象封装 |
| PostMessageEngine 实现 | 📋 未开始 |
| UIAutomationEngine 实现 | 📋 未开始 |
| 路线切换 UI | 📋 未开始 |
| 自动回退机制 | 📋 未开始 |

---

## 参考资料

| 资源 | 说明 |
|------|------|
| [PostMessageW - Win32](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postmessagew) | Win32 消息投递 API 文档 |
| [WM_CHAR](https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-char) | 字符消息文档 |
| [WM_IME_CHAR](https://learn.microsoft.com/en-us/windows/win32/intl/wm-ime-char) | IME 字符消息文档 |
| [UI Automation](https://learn.microsoft.com/en-us/windows/win32/uto/uiauto-entry) | 微软 UI Automation 框架文档 |
| [IUIAutomationValuePattern](https://learn.microsoft.com/en-us/windows/win32/api/uiautomationclient/nn-uiautomationclient-iuiautomationvaluepattern) | UIA 值模式接口 |
