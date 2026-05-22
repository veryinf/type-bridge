package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

var (
	db   *sql.DB
	once sync.Once
)

// Init 初始化数据库连接
func Init(dbPath string) error {
	var initErr error
	once.Do(func() {
		// 确保目录存在
		dir := filepath.Dir(dbPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			initErr = fmt.Errorf("创建数据库目录失败: %w", err)
			return
		}

		var err error
		db, err = sql.Open("sqlite3", dbPath+"?_journal_mode=WAL")
		if err != nil {
			initErr = fmt.Errorf("打开数据库失败: %w", err)
			return
		}

		// 测试连接
		if err := db.Ping(); err != nil {
			initErr = fmt.Errorf("数据库连接失败: %w", err)
			return
		}

		// 创建表
		if err := createTables(); err != nil {
			initErr = fmt.Errorf("创建表失败: %w", err)
			return
		}
	})
	return initErr
}

// GetDB 获取数据库实例
func GetDB() *sql.DB {
	return db
}

// Close 关闭数据库连接
func Close() error {
	if db != nil {
		return db.Close()
	}
	return nil
}

// createTables 创建必要的表
func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS templates (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			content TEXT NOT NULL,
			type TEXT NOT NULL DEFAULT 'text',
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_templates_sort_order ON templates(sort_order)`,
		`CREATE TABLE IF NOT EXISTS console_layouts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			description TEXT DEFAULT '',
			author TEXT DEFAULT '',
			help_text TEXT DEFAULT '',
			is_default INTEGER DEFAULT 0,
			config TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return err
		}
	}

	return insertDefaultLayout()
}

func insertDefaultLayout() error {
	// 检查是否已有布局
	var count int
	db.QueryRow("SELECT COUNT(*) FROM console_layouts").Scan(&count)
	if count > 0 {
		return nil
	}

	// 插入默认布局
	defaultConfig := `{
  "inputButtons": [
    {"id":"send","label":"发送","style":"send","commands":[{"action":"text","text":"{{input}}","applyRules":true}]},
    {"id":"enter","label":"回车","style":"enter","commands":[{"action":"key","key":"enter"}]},
    {"id":"submit","label":"提交","style":"submit","commands":[{"action":"text","text":"{{input}}","applyRules":true},{"action":"key","key":"enter"}]},
    {"id":"expand","label":"更大","style":"expand","clientAction":"expand"},
    {"id":"clear","label":"清空","style":"clear","clientAction":"clear"}
  ],
  "actionButtons": [
    {"id":"left","label":"←","style":"cursor","commands":[{"action":"key","key":"left"}]},
    {"id":"up","label":"↑","style":"cursor","commands":[{"action":"key","key":"up"}]},
    {"id":"down","label":"↓","style":"cursor","commands":[{"action":"key","key":"down"}]},
    {"id":"right","label":"→","style":"cursor","commands":[{"action":"key","key":"right"}]},
    {"id":"delete","label":"删除","style":"delete","commands":[{"action":"key","key":"backspace"}]},
    {"id":"undo","label":"撤销","style":"undo","commands":[{"action":"undo"}]},
    {"id":"resend","label":"上次","style":"resend","clientAction":"resend"},
    {"id":"symbol1","label":"（）","style":"symbol","clientAction":"symbol","params":"()"}
  ],
  "extraActionButtons": [
    {"id":"symbol2","label":"\\"\"","style":"symbol","clientAction":"symbol","params":"\\""},
    {"id":"symbol3","label":"「」","style":"symbol","clientAction":"symbol","params":"「」"},
    {"id":"symbol4","label":"[]","style":"symbol","clientAction":"symbol","params":"[]"}
  ],
  "gridColumns": 4
}`

	defaultHelp := `## 基本操作
- **发送** - 将文本发送到电脑（应用替换规则）
- **回车** - 发送回车键
- **提交** - 发送文本 + 回车
- **清空** - 清空输入框

## 快捷操作
- **光标移动** - 控制电脑光标方向
- **删除** - 删除电脑上的字符
- **撤销** - 撤销上一次发送
- **上次** - 重新发送上一次内容

## 使用提示
- 确保手机和电脑在同一局域网
- 文本会通过剪贴板粘贴到电脑当前焦点
- 支持正则替换规则（在 hot-rule.txt 配置）`

	_, err := db.Exec(
		"INSERT INTO console_layouts (name, description, author, help_text, is_default, config) VALUES (?, ?, ?, ?, 1, ?)",
		"默认布局", "EasyInput 默认控制台布局", "EasyInput", defaultHelp, defaultConfig,
	)
	return err
}
