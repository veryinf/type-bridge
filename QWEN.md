# Type Bridge - 手机电脑输入同步工具

## 项目概述

Type Bridge 是一款基于 Wails v3 框架的桌面应用程序，允许用户通过手机浏览器远程控制电脑输入。手机和电脑连接同一 WiFi 后，手机扫描二维码即可访问控制页面，实现文本发送、回车、撤销、光标移动等操作。

### 核心功能

- 📝 **文本发送**：手机输入文字后同步到电脑当前焦点位置
- 🔄 **正则替换**：支持通过 `console.json` 配置文本自动替换规则
- ↵ **回车控制**：远程发送回车键
- ↩️ **撤销操作**：撤销上一次发送的文本或回车
- 🖱️ **光标控制**：上下左右移动光标
- 🗑️ **删除功能**：发送退格键删除
- 🔤 **符号包裹**：快速输入括号、引号等符号配对
- ⌨️ **组合键**：支持发送 Ctrl+V 等组合键操作
- 📋 **快捷模板**：SQLite 存储常用文本模板，一键发送
- 🎛️ **控制台配置**：JSON 驱动的按钮布局，可自定义按钮、分组和命令序列
- 📊 **操作日志**：SQLite 存储，桌面端和手机端实时查看
- 🖥️ **系统托盘**：最小化到系统托盘后台运行
- 🎨 **主题切换**：桌面端支持浅色/深色主题
- 📡 **多网卡支持**：自动检测局域网 IP，支持多网卡切换

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Wails v3 | v3.0.0-alpha.96 |
| 后端语言 | Go | 1.25.0 |
| 数据库 | SQLite (go-sqlite3) | v1.14.44 |
| 键盘自动化 | robotgo | v1.0.0 |
| 前端框架 | React | 18.x |
| 前端语言 | TypeScript | 6.x |
| 构建工具 | Vite | 3.x |
| UI 样式 | Tailwind CSS | 4.2.x |
| UI 组件 | shadcn/ui (Radix UI) | - |
| 桌面端路由 | wouter | 3.10.0 |
| 手机端路由 | react-router-dom | 7.16.0 |
| 图标库 | lucide-react | 1.16.0 |
| 二维码 | qrcode.react | 4.2.0 |
| 系统托盘 | systray | v1.2.2 |
| 包管理 | pnpm | - |
| 构建编排 | Taskfile v3 | - |

## 项目结构

```
easy-input/
├── main.go                    # 入口文件：Wails v3 应用启动、系统托盘、CLI 参数
├── app.go                     # 核心逻辑：Service 接口实现、HTTP 服务器、命令执行、Wails 绑定
├── console.json               # 控制台配置（按钮布局 + 替换规则，打包时嵌入）
├── wails.json                 # Wails 项目配置（v3 schema）
├── go.mod / go.sum            # Go 依赖管理
├── Taskfile.yml               # 顶层 Taskfile，引用 build/Taskfile.yml
├── backend/
│   ├── automation/
│   │   ├── keyboard.go        # 键盘操作封装（robotgo）
│   │   ├── rules.go           # 正则替换规则引擎
│   │   └── clipboard_*.go     # 平台相关剪贴板操作（build tag 分离）
│   ├── database/
│   │   ├── db.go              # SQLite 数据库初始化（WAL 模式）
│   │   ├── config.go          # 配置项读写
│   │   ├── logs.go            # 日志存储与查询
│   │   └── templates.go       # 快捷模板 CRUD
│   └── server/
│       └── handler.go         # 版本更新检查
├── frontend/                  # 桌面端管理界面（Wails 前端）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx   # 主页（QR 码、IP 切换）
│   │   │   ├── LogPage.tsx    # 操作日志
│   │   │   ├── SettingsPage.tsx # 设置（端口、主题、日志数量）
│   │   │   └── AboutPage.tsx  # 关于页面
│   │   ├── components/
│   │   │   ├── Sidebar.tsx    # 导航侧边栏
│   │   │   ├── PageHeader.tsx # 页面标题栏
│   │   │   └── ui/            # shadcn/ui 组件
│   │   ├── hooks/
│   │   │   └── useTheme.ts    # 主题切换 Hook
│   │   └── lib/
│   │       └── utils.ts       # 工具函数（cn 等）
│   ├── wailsjs/               # Wails 自动生成的 JS 绑定
│   ├── package.json
│   ├── vite.config.ts         # 开发端口 9245（由 Wails 管理）
│   └── tsconfig.json
├── remote/                    # 手机端远程操作界面
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ConsolePage.tsx # 控制台主界面（动态按钮布局）
│   │   │   └── SettingsPage.tsx # 移动端设置
│   │   ├── components/
│   │   │   ├── InputBox.tsx   # 输入框 + 快捷按钮
│   │   │   ├── ActionButtons.tsx # 功能按钮组（JSON 配置驱动）
│   │   │   ├── StatusBar.tsx  # 连接状态栏
│   │   │   ├── BottomNav.tsx  # 底部导航
│   │   │   ├── HistoryModal.tsx # 历史记录弹窗
│   │   │   ├── HelpModal.tsx  # 帮助弹窗
│   │   │   ├── HelpPopover.tsx # 帮助提示（长按触发）
│   │   │   └── ExpandModal.tsx # 全屏编辑器
│   │   ├── hooks/
│   │   │   ├── useApi.ts      # HTTP API 封装
│   │   │   ├── useToast.tsx   # Toast 提示
│   │   │   └── useLongPress.ts # 长按手势
│   │   └── types/
│   │       └── layout.ts      # 布局配置类型定义
│   ├── package.json
│   ├── vite.config.ts         # 开发端口 3020（host 0.0.0.0，代理 /api）
│   └── tsconfig.json
├── db/                        # SQLite 数据库文件目录（运行时自动创建）
│   └── typebridge.db
├── docs/                      # 项目文档
│   ├── input-engine.md        # 输入引擎设计文档
│   └── console-json.md        # 控制台配置文档
└── build/
    ├── Taskfile.yml           # 公共构建任务定义
    ├── config.yml             # Wails v3 构建配置
    ├── appicon.png            # 应用图标
    ├── windows/               # Windows 构建资源
    └── darwin/                # macOS 构建资源
```

## 架构说明

### 运行流程

1. `main.go` 启动 Wails v3 应用，初始化数据库和系统托盘
2. `app.go` 中 `ServiceStartup()` 加载控制台配置、初始化替换规则并启动 HTTP 服务器（默认端口 5000）
3. 桌面窗口显示 QR 码和访问地址
4. 手机浏览器访问 `http://<电脑IP>:5000/mobile.html`
5. 手机端操作通过 HTTP REST API 发送到电脑端
6. 电脑端通过 `robotgo` 模拟键盘操作，将文本粘贴到当前焦点窗口

### 关键组件

- **`main.go`**：Wails v3 应用入口，包含系统托盘、CLI 参数解析（`-port`）、端口检测、开发模式 Vite 等待逻辑
- **`app.go`**：Wails v3 Service 实现（`ServiceStartup`/`ServiceShutdown`），包含所有绑定方法和 HTTP 处理器，通过 `embed.FS` 嵌入 `remote/dist` 静态文件和 `console.json`
- **`frontend/`**：桌面端管理界面，Wails 前端，通过 `embed.FS` 嵌入到 Go 二进制
- **`remote/`**：手机端远程操作界面，构建产物通过 `embed.FS` 嵌入，由 HTTP 服务器提供给手机浏览器访问
- **`backend/automation/rules.go`**：正则替换规则引擎，从 `console.json` 的 `rules` 数组加载规则
- **`backend/automation/keyboard.go`**：封装 robotgo 的键盘操作，包括粘贴（通过剪贴板）、按键、撤销等
- **`backend/database/`**：SQLite 数据库模块，使用 WAL 模式，存储日志、模板和配置

### 文本粘贴机制

文本粘贴通过系统剪贴板实现：
1. 保存当前剪贴板内容
2. 将待输入文本写入系统剪贴板
3. 模拟 `Ctrl+V` 粘贴到焦点窗口
4. 等待 50ms 后恢复原始剪贴板内容

### 控制台配置格式

`console.json` 驱动手机端界面的按钮布局和替换规则。详细格式参见 `docs/console-json.md`。

## 构建与运行

### 环境要求

- Go 1.25+
- Node.js 16+
- pnpm
- Wails v3 CLI（`go install github.com/wailsapp/wails/v3/cmd/wails3@latest`）
- Task runner（`go install github.com/go-task/task/v3/cmd/task@latest`）

### 开发模式

```bash
# 启动完整开发环境（Go + 前端 + 远程界面，支持热重载）
wails3 dev -config ./build/config.yml -port 9245
```

该命令会自动：
- 安装前端依赖
- 生成 Wails JS 绑定
- 启动 remote 开发服务器（端口 3020）
- 启动 frontend 开发服务器（端口 9245）
- 编译并运行 Go 应用

### 生产构建

```bash
# 构建可执行文件（自动构建前端和远程界面）
task build
```

构建产物输出到 `build/bin/TypeBridge.exe`。

### 仅前端开发

```bash
# 桌面端管理界面
cd frontend
pnpm install
pnpm run dev      # 开发服务器，端口 9245

# 手机端远程界面
cd remote
pnpm install
pnpm run dev      # 开发服务器，端口 3020（监听 0.0.0.0，支持局域网访问）
```

### 单独构建任务

```bash
task build:frontend       # 构建桌面端前端
task build:remote         # 构建手机端远程界面
task build:go             # 构建 Go 二进制
task generate:bindings    # 生成 Wails JS 绑定
```

## 开发约定

- **语言**：后端 Go，前端 TypeScript + React
- **项目分为三部分**：Go 后端、`frontend/` 桌面端管理界面（Wails 前端）、`remote/` 手机端远程界面
- **代码风格**：Go 遵循标准 `gofmt` 格式；前端使用 Tailwind CSS
- **组件命名**：React 组件使用 PascalCase，文件名与组件名一致
- **包管理**：前端使用 pnpm（两个前端项目各自独立 `pnpm install`）
- **构建编排**：使用 Taskfile v3（`build/Taskfile.yml` 定义公共任务，根目录 `Taskfile.yml` 引用）
- **API 通信**：桌面端与前端通过 Wails v3 绑定（`wailsjs/`），手机端通过 HTTP REST API
- **状态管理**：使用 React Hooks（`useState`, `useEffect`, `useRef`），无外部状态库
- **错误处理**：HTTP 接口返回 JSON `{status, msg}` 格式
- **日志**：SQLite 存储，桌面端和手机端实时查看
- **Wails v3 服务模式**：使用 `ServiceStartup`/`ServiceShutdown` 生命周期（非 v2 的 `OnStartup`）
- **数据库**：SQLite WAL 模式，路径为 `<exeDir>/db/typebridge.db`
- **配置**：运行时配置存 SQLite（端口、日志数量等），按钮布局存 `console.json` 文件

## API 端点

手机端通过以下 HTTP API 与电脑端通信：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/execute` | 执行命令序列 |
| GET | `/api/v1/logs` | 获取操作日志 |
| GET | `/api/v1/templates` | 获取所有模板 |
| POST | `/api/v1/templates` | 创建模板 |
| GET | `/api/v1/templates/{id}` | 获取单个模板 |
| PUT | `/api/v1/templates/{id}` | 更新模板 |
| DELETE | `/api/v1/templates/{id}` | 删除模板 |
| GET | `/api/v1/console` | 获取控制台配置 |
| GET | `/api/v1/version` | 获取版本信息 |

## 支持平台

- ✅ Windows 10/11
- ⏳ macOS（构建配置已就绪，待完善）
- ✅ 手机浏览器：Chrome、Safari、Firefox 等现代浏览器
