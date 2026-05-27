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
		`CREATE TABLE IF NOT EXISTS logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			time TEXT NOT NULL,
			type TEXT NOT NULL,
			content TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS config (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		)`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return err
		}
	}

	return nil
}
