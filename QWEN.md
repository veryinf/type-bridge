# EasyInput - 手机电脑输入同步工具

## 项目概述

EasyInput 是一款基于 Wails 框架的桌面应用程序，允许用户通过手机浏览器远程控制电脑输入。手机和电脑连接同一 WiFi 后，手机扫描二维码即可访问控制页面，实现文本发送、回车、撤销、光标移动等操作。

### 核心功能

- 📝 **文本发送**：手机输入文字后同步到电脑当前焦点位置
- 🔄 **正则替换**：支持通过 `hot-rule.txt` 配置文本自动替换规则
- ↵ **回车控制**：远程发送回车键
- ↩️ **撤销操作**：撤销上一次发送的文本或回车
- 🖱️ **光标控制**：上下左右移动光标
- 🗑️ **删除功能**：发送退格键删除
- 🔤 **符号包裹**：快速输入括号、引号等符号配对
- 📊 **操作日志**：实时查看操作记录
- 🖥️ **系统托盘**：最小化到系统托盘后台运行

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Wails v2 | v2.12.0 |
| 后端语言 | Go | 1.24.0 |
| 前端框架 | React | 18.x |
| 前端语言 | TypeScript | 4.6.x |
| 构建工具 | Vite | 3.x |
| UI 样式 | Tailwind CSS | 4.2.x |
| 键盘自动化 | robotgo | v1.0.0 |
| 系统托盘 | systray | v1.2.2 |
| 二维码 | qrcode.react | v4.2.0 |

## 项目结构

```
easy-input/
├── main.go                    # 入口文件：Wails 应用启动、系统托盘
├── app.go                     # 核心逻辑：Wails 绑定方法、HTTP 服务器、嵌入远程界面
├── hot-rule.txt               # 正则替换规则配置文件
├── wails.json                 # Wails 项目配置
├── go.mod / go.sum            # Go 依赖管理
├── backend/
│   ├── automation/
│   │   ├── keyboard.go        # 键盘操作封装（robotgo）
│   │   └── rules.go           # 正则替换规则引擎
│   └── server/
│       └── handler.go         # 独立 HTTP 处理器、版本更新检查
├── control/                   # 管理界面（Wails 桌面端）
│   ├── src/
│   │   ├── main.tsx           # React 入口
│   │   ├── App.tsx            # 路由配置
│   │   ├── components/
│   │   │   ├── Sidebar.tsx    # 导航侧边栏
│   │   │   └── ui/            # UI 基础组件（Radix UI）
│   │   ├── pages/
│   │   │   ├── HomePage.tsx   # 主页（QR码展示）
│   │   │   ├── LogPage.tsx    # 操作日志
│   │   │   ├── RulesPage.tsx  # 规则管理
│   │   │   ├── SettingsPage.tsx # 设置
│   │   │   └── AboutPage.tsx  # 关于页面
│   │   ├── hooks/             # React Hooks
│   │   └── lib/               # 工具库
│   ├── wailsjs/               # Wails 自动生成的 JS 绑定
│   ├── package.json
│   ├── vite.config.ts         # 开发端口 3010
│   └── tsconfig.json
├── frontend/                  # → junction 链接指向 control/（Wails 兼容）
├── remote/                    # 手机端远程操作界面
│   ├── src/
│   │   ├── main.tsx           # React 入口
│   │   ├── App.tsx            # 主组件
│   │   ├── components/
│   │   │   ├── InputBox.tsx   # 文本输入框
│   │   │   ├── ActionButtons.tsx # 发送/回车/撤销/清空按钮
│   │   │   ├── CursorButtons.tsx # 光标方向按钮
│   │   │   ├── SymbolButtons.tsx # 符号包裹按钮
│   │   │   └── SymbolModal.tsx   # 符号输入弹窗
│   │   └── hooks/
│   │       └── useApi.ts      # HTTP API 封装
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts         # 开发端口 3020
│   └── tsconfig.json
└── build/
    ├── appicon.png            # 应用图标
    ├── windows/               # Windows 构建资源
    └── darwin/                # macOS 构建资源
```

## 构建与运行

### 环境要求

- Go 1.24+
- Node.js 16+
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### 开发模式

```bash
# 启动开发服务器（支持热重载）
wails dev
```

开发模式下前端运行在 Vite 开发服务器，Go 方法可通过 `http://localhost:34115` 在浏览器 DevTools 中调用。

### 生产构建

```bash
# 构建可执行文件
wails build
```

构建产物输出到 `build/bin/` 目录。

### 仅前端开发

```bash
# 管理界面（桌面端）
cd control
pnpm install
pnpm run dev      # 开发服务器，端口 3010
pnpm run build    # TypeScript 编译 + Vite 构建

# 手机端远程界面
cd remote
pnpm install
pnpm run dev      # 开发服务器，端口 3020
pnpm run build    # TypeScript 编译 + Vite 构建
```

## 架构说明

### 运行流程

1. `main.go` 启动 Wails 应用并初始化系统托盘
2. `app.go` 中 `startup()` 加载替换规则并启动 HTTP 服务器（默认端口 5000）
3. 桌面窗口显示 QR 码和访问地址
4. 手机浏览器访问 `http://<电脑IP>:5000/mobile.html`
5. 手机端操作通过 HTTP POST 请求发送到电脑端
6. 电脑端通过 `robotgo` 模拟键盘操作，将文本粘贴到当前焦点窗口

### 关键组件

- **`app.go`**：包含 Wails 绑定方法（`SendText`, `SendEnter`, `Undo` 等）和内嵌的 HTTP 服务器，通过 `embed.FS` 嵌入 `remote/dist` 静态文件
- **`control/`**：管理界面，Wails 桌面端前端，通过 `embed.FS` 嵌入到 Go 二进制
- **`remote/`**：手机端远程操作界面，构建产物通过 `embed.FS` 嵌入，由 HTTP 服务器提供给手机浏览器访问
- **`frontend/`**：Windows junction 链接，指向 `control/`，保持 Wails 自动检测兼容
- **`backend/automation/rules.go`**：正则替换规则引擎，从 `hot-rule.txt` 加载 `pattern=replace` 格式的规则
- **`backend/automation/keyboard.go`**：封装 robotgo 的键盘操作，包括粘贴（通过剪贴板）、按键、撤销等
- **`backend/server/handler.go`**：独立的 HTTP 处理器实现，包含版本更新检查功能

### 文本替换规则格式

`hot-rule.txt` 中每行一条规则：

```
# 注释行以 # 开头
正则表达式 = 替换文本
```

示例：
```
毫安时 = mAh
(艾特)\s*(QQ)\s*点 = @qq.
```

## 开发约定

- **语言**：后端 Go，前端 TypeScript + React
- **项目分为三部分**：Go 后端、`control/` 管理界面（Wails 桌面端）、`remote/` 手机端远程界面
- **代码风格**：Go 遵循标准 `gofmt` 格式；前端使用 Tailwind CSS + 自定义 CSS
- **组件命名**：React 组件使用 PascalCase，文件名与组件名一致
- **包管理**：前端使用 pnpm
- **API 通信**：桌面端与前端通过 Wails 绑定（`wailsjs/`），手机端通过 HTTP REST API
- **状态管理**：使用 React Hooks（`useState`, `useEffect`, `useRef`），无外部状态库
- **错误处理**：HTTP 接口返回 JSON `{status, msg}` 格式
- **日志**：应用内日志系统，最多保留 100 条，手机端可实时查看

## 注意事项

- 文本粘贴通过系统剪贴板实现，粘贴后会恢复原始剪贴板内容
- 手机和电脑必须在同一局域网内
- 应用窗口最小化后通过系统托盘的"显示窗口"菜单恢复
- `backend/server/handler.go` 中的 `CheckUpdate` 函数可检查 GitHub Release 更新
