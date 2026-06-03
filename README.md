# Type Bridge - 手机电脑输入同步工具

> 📱 手机扫码，电脑打字 - 让手机成为电脑的无线键盘

## ✨ 功能特点

- 📝 **文本同步** - 手机输入文字，直接发送到电脑当前窗口
- 🔄 **智能替换** - 支持正则表达式自动替换（如：输入"毫安时"自动变成"mAh"）
- ↵ **远程控制** - 发送回车、撤销、删除等操作
- 🖱️ **光标移动** - 远程控制电脑光标方向
- 🔤 **符号包裹** - 快速输入括号、引号等符号配对
- ⌨️ **组合键** - 支持发送 Ctrl+V 等组合键操作
- 📋 **快捷模板** - 数据库存储常用文本模板，一键发送
- 🎛️ **控制台配置** - JSON 驱动的按钮布局，可自定义按钮、分组和命令序列
- 📊 **操作日志** - SQLite 存储，桌面端和手机端实时查看
- 🖥️ **系统托盘** - 最小化后在后台运行
- 🎨 **主题切换** - 桌面端支持浅色/深色主题
- 📡 **多网卡支持** - 自动检测局域网 IP，支持多网卡切换

## 📥 下载安装

1. 从 [Releases](https://github.com/veryinf/easy-input/releases) 页面下载最新版本
2. 解压到任意目录
3. 运行 `TypeBridge.exe`

## 🚀 快速使用

### 第一步：启动程序

双击运行 `TypeBridge.exe`，程序会显示一个二维码和访问地址。

### 第二步：手机连接

1. 确保手机和电脑连接到同一个 WiFi 网络
2. 用手机扫描屏幕上的二维码
3. 或者在手机浏览器输入显示的地址（如：`http://192.168.1.100:5000`）

### 第三步：开始使用

在手机上输入文字，点击"发送"按钮，文字就会出现在电脑当前光标位置。

## 📖 功能说明

### 基本操作

| 按钮 | 功能 |
|------|------|
| 发送 | 将输入框的文字发送到电脑（应用替换规则） |
| 回车 | 发送回车键 |
| 提交 | 发送文字 + 回车（适合聊天、表单提交） |
| 清空 | 清空输入框 |

### 光标与编辑

| 按钮 | 功能 |
|------|------|
| ↑↓←→ | 移动电脑光标 |
| 删除 | 删除电脑上的字符 |
| 撤销 | 撤销上一次发送 |

### 符号输入

点击符号按钮可以快速在输入文字两端添加符号对：
- `()` `""` `「」` `[]`
- 可在控制台配置中自定义更多符号

### 全屏编辑

点击输入框右侧的展开按钮，可以打开全屏编辑器，适合输入长文本。

### 历史记录

手机端保存发送过的历史文本，可快速重新发送。

### 快捷模板

支持创建常用文本模板（如常用句式、代码片段），在手机端一键发送。模板存储在数据库中，支持增删改查。

### 长按帮助

长按任意功能按钮可查看该按钮的详细说明。

## ⚙️ 配置说明

### 控制台配置

程序使用 `console.json` 文件驱动手机端控制台的按钮布局和替换规则。文件结构如下：

```json
{
  "help_text": "按钮帮助文本（支持 Markdown）",
  "inputButtons": [
    {
      "id": "send",
      "label": "发送",
      "variant": "primary",
      "commands": [
        { "action": "text", "text": "{{input}}", "applyRules": true }
      ]
    }
  ],
  "actionGroups": [
    {
      "title": "光标控制",
      "columns": 4,
      "buttons": [...]
    }
  ],
  "rules": [
    { "pattern": "毫安时", "replacement": "mAh", "enabled": true }
  ]
}
```

### 按钮类型

| variant | 说明 |
|---------|------|
| `primary` | 主要操作（发送） |
| `info` | 信息操作（回车、提交） |
| `secondary` | 次要操作（撤销） |
| `danger` | 危险操作（删除） |
| `cursor` | 光标控制 |
| `symbol` | 符号操作 |
| `ghost` | 低调按钮 |

### 命令类型

每个按钮可配置一组命令序列，支持以下命令：

| action | 字段 | 说明 |
|--------|------|------|
| `text` | `text`, `applyRules` | 发送文本，`{{input}}` 为输入框内容占位符 |
| `key` | `key` | 按键（如 `enter`, `backspace`, `left`） |
| `combo` | `keys` | 组合键（如 `["ctrl", "v"]`） |
| `delay` | `ms` | 延迟（毫秒） |
| `undo` | - | 撤销上一次操作 |

### 替换规则

在 `console.json` 的 `rules` 数组中配置：

```json
{
  "pattern": "正则表达式",
  "replacement": "替换文本",
  "enabled": true
}
```

规则说明：
- 支持正则表达式
- `enabled` 字段可单独启用/禁用规则
- 替换在发送时自动执行

### 常用规则示例

```json
[
  { "pattern": "毫安时", "replacement": "mAh", "enabled": true },
  { "pattern": "赫兹", "replacement": "Hz", "enabled": true },
  { "pattern": "(艾特)\\s*(QQ)\\s*点", "replacement": "@qq.", "enabled": true }
]
```

## 📡 API 端点

手机端通过以下 HTTP API 与电脑端通信：

### 执行命令

```
POST /api/v1/execute
Content-Type: application/json

{
  "commands": [
    { "action": "text", "text": "你好", "applyRules": true },
    { "action": "key", "key": "enter" }
  ]
}
```

### 日志查询

```
GET /api/v1/logs
```

返回最近 N 条操作日志（默认 100 条）。

### 模板管理

```
GET    /api/v1/templates          # 获取所有模板
POST   /api/v1/templates          # 创建模板 {name, content, type}
GET    /api/v1/templates/{id}     # 获取单个模板
PUT    /api/v1/templates/{id}     # 更新模板
DELETE /api/v1/templates/{id}     # 删除模板
```

### 控制台配置

```
GET    /api/v1/console            # 获取控制台配置
PUT    /api/v1/console            # 保存控制台配置
```

### 版本信息

```
GET    /api/v1/version            # {"version": "1.0.0"}
```

## 💡 使用技巧

1. **快速输入** - 输入常用短语后点击"发送"，比打字更快
2. **命令组合** - 一个按钮可配置多条命令，如"发送文字 + 延迟 + 回车"
3. **模板管理** - 在桌面端管理常用模板，手机端一键调用
4. **自定义布局** - 编辑 `console.json` 自定义手机端按钮布局
5. **符号配对** - 输入文字后点击符号按钮，自动在文字两端添加符号
6. **全屏编辑** - 使用全屏编辑器输入长文本，支持多行编辑

## ❓ 常见问题

### Q: 手机无法连接电脑？

A: 请检查：
1. 手机和电脑是否连接到同一个 WiFi 网络
2. 电脑防火墙是否阻止了程序（尝试关闭防火墙或添加例外）
3. 程序是否正常运行（检查系统托盘图标）
4. 桌面端主页可切换不同的局域网 IP 地址

### Q: 文字发送后没有出现在电脑上？

A: 请检查：
1. 电脑上是否有正在输入的窗口（如文本框、编辑器）
2. 尝试点击电脑上的目标窗口，确保它是活动窗口
3. 检查程序日志查看是否有错误信息

### Q: 替换规则不生效？

A: 请检查：
1. `console.json` 中 `rules` 数组格式是否正确
2. 规则的 `enabled` 字段是否为 `true`
3. 保存配置后规则会自动重新加载，无需重启程序

### Q: 如何让程序开机自启动？

A: 目前需要手动设置：
1. 创建程序的快捷方式
2. 将快捷方式放到启动文件夹：
   - 按 `Win + R`，输入 `shell:startup`
   - 将快捷方式粘贴到打开的文件夹中

### Q: 如何更新程序？

A:
1. 程序会自动检查更新（在"关于"页面）
2. 下载新版本后，关闭旧程序
3. 用新文件替换旧文件即可（配置文件和数据库会保留）

## 📁 项目结构

```
easy-input/
├── main.go                         # 入口文件：Wails 应用启动、系统托盘
├── app.go                          # 核心逻辑：Wails 绑定方法、HTTP 服务器、命令执行
├── console.json                  # 控制台配置（按钮布局 + 替换规则）
├── build-remote.cmd                # 远程界面构建脚本
├── wails.json                      # Wails 项目配置
├── go.mod / go.sum                 # Go 依赖管理
├── backend/
│   ├── automation/
│   │   ├── keyboard.go             # 键盘操作封装（robotgo）
│   │   └── rules.go                # 正则替换规则引擎
│   ├── database/
│   │   ├── db.go                   # SQLite 数据库初始化（WAL 模式）
│   │   ├── config.go               # 配置项读写
│   │   ├── logs.go                 # 日志存储与查询
│   │   └── templates.go            # 快捷模板 CRUD
│   └── server/
│       └── handler.go              # 版本更新检查
├── frontend/                       # 桌面端管理界面（Wails 前端）
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # 主页（QR 码、IP 切换）
│   │   │   ├── LogPage.tsx         # 操作日志
│   │   │   ├── SettingsPage.tsx    # 设置（端口、主题、日志数量）
│   │   │   └── AboutPage.tsx       # 关于页面
│   │   ├── components/
│   │   │   ├── Sidebar.tsx         # 导航侧边栏
│   │   │   ├── PageHeader.tsx      # 页面标题栏
│   │   │   └── ui/                 # shadcn/ui 组件
│   │   ├── hooks/
│   │   │   └── useTheme.ts         # 主题切换 Hook
│   │   └── lib/
│   │       └── utils.ts            # 工具函数
│   ├── wailsjs/                    # Wails 自动生成的 JS 绑定
│   ├── package.json
│   ├── vite.config.ts              # 开发端口 3010
│   └── tsconfig.json
├── remote/                         # 手机端远程操作界面
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ConsolePage.tsx     # 控制台主界面（动态按钮布局）
│   │   │   └── SettingsPage.tsx    # 移动端设置
│   │   ├── components/
│   │   │   ├── InputBox.tsx        # 输入框 + 快捷按钮
│   │   │   ├── ActionButtons.tsx   # 功能按钮组（JSON 配置驱动）
│   │   │   ├── StatusBar.tsx       # 连接状态栏
│   │   │   ├── BottomNav.tsx       # 底部导航
│   │   │   ├── HistoryModal.tsx    # 历史记录弹窗
│   │   │   ├── HelpModal.tsx       # 帮助弹窗
│   │   │   ├── HelpPopover.tsx     # 帮助提示（长按触发）
│   │   │   └── ExpandModal.tsx     # 全屏编辑器
│   │   ├── hooks/
│   │   │   ├── useApi.ts           # HTTP API 封装
│   │   │   ├── useToast.tsx        # Toast 提示
│   │   │   └── useLongPress.ts     # 长按手势
│   │   └── types/
│   │       └── layout.ts           # 布局配置类型定义
│   ├── package.json
│   ├── vite.config.ts              # 开发端口 3020
│   └── tsconfig.json
├── db/                             # SQLite 数据库文件目录
│   └── typebridge.db               # 运行时自动创建
├── docs/                           # 项目文档
│   ├── input-engine.md             # 输入引擎设计文档
│   └── console-json.md             # 控制台配置文档
└── build/
    ├── appicon.png                 # 应用图标
    ├── windows/                    # Windows 构建资源
    └── darwin/                     # macOS 构建资源
```

## 🛠️ 构建与运行

### 环境要求

- Go 1.24+
- Node.js 16+
- pnpm
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### 开发模式

```bash
# 启动开发服务器（支持热重载）
wails dev
```

开发模式下前端运行在 Vite 开发服务器，Go 方法可通过 `http://localhost:34115` 在浏览器 DevTools 中调用。

### 生产构建

```bash
# 构建可执行文件（自动构建远程界面）
wails build
```

构建产物输出到 `build/bin/` 目录。`build-remote.cmd` 会在构建前自动编译远程界面。

### 仅前端开发

```bash
# 桌面端管理界面
cd frontend
pnpm install
pnpm run dev      # 开发服务器，端口 3010

# 手机端远程界面
cd remote
pnpm install
pnpm run dev      # 开发服务器，端口 3020（默认监听 0.0.0.0，支持局域网访问）
```

## 🏗️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Wails v2 | v2.12.0 |
| 后端语言 | Go | 1.24.0 |
| 数据库 | SQLite (go-sqlite3) | v1.14.44 |
| 键盘自动化 | robotgo | v1.0.0 |
| 前端框架 | React | 18.x |
| 前端语言 | TypeScript | 6.x |
| 构建工具 | Vite | 3.x |
| UI 样式 | Tailwind CSS | 4.2.x |
| UI 组件 | shadcn/ui (Radix UI) | - |
| 路由库 | wouter | 3.10.0 |
| 图标库 | lucide-react | 1.16.0 |
| 二维码 | qrcode.react | 4.2.0 |
| 系统托盘 | systray | v1.2.2 |

## 📱 支持平台

- ✅ Windows 10/11
- ⏳ macOS（即将支持）
- ✅ 手机浏览器：Chrome、Safari、Firefox 等现代浏览器

## 📞 获取帮助

- 查看程序内的帮助按钮
- 查阅 `docs/` 目录下的技术文档
- 在 GitHub 提交 Issue：[项目地址](https://github.com/veryinf/easy-input/issues)

## 📄 许可证

本项目采用 MIT 许可证。

---

**感谢使用 Type Bridge！** 🎉
