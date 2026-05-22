package database

import (
	"fmt"
	"time"
)

// ConsoleLayout 控制台布局
type ConsoleLayout struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Author      string `json:"author"`
	HelpText    string `json:"help_text"`
	IsDefault   bool   `json:"is_default"`
	Config      string `json:"config"` // JSON 格式的布局配置
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// GetAllLayouts 获取所有布局
func GetAllLayouts() ([]ConsoleLayout, error) {
	db := GetDB()
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	rows, err := db.Query("SELECT id, name, description, author, help_text, is_default, config, created_at, updated_at FROM console_layouts ORDER BY is_default DESC, id ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var layouts []ConsoleLayout
	for rows.Next() {
		var l ConsoleLayout
		var isDefault int
		if err := rows.Scan(&l.ID, &l.Name, &l.Description, &l.Author, &l.HelpText, &isDefault, &l.Config, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, err
		}
		l.IsDefault = isDefault == 1
		layouts = append(layouts, l)
	}
	return layouts, nil
}

// GetLayoutByID 根据ID获取布局
func GetLayoutByID(id int) (*ConsoleLayout, error) {
	db := GetDB()
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	var l ConsoleLayout
	var isDefault int
	err := db.QueryRow("SELECT id, name, description, author, help_text, is_default, config, created_at, updated_at FROM console_layouts WHERE id = ?", id).
		Scan(&l.ID, &l.Name, &l.Description, &l.Author, &l.HelpText, &isDefault, &l.Config, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return nil, err
	}
	l.IsDefault = isDefault == 1
	return &l, nil
}

// GetDefaultLayout 获取默认布局
func GetDefaultLayout() (*ConsoleLayout, error) {
	db := GetDB()
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	var l ConsoleLayout
	var isDefault int
	err := db.QueryRow("SELECT id, name, description, author, help_text, is_default, config, created_at, updated_at FROM console_layouts WHERE is_default = 1 LIMIT 1").
		Scan(&l.ID, &l.Name, &l.Description, &l.Author, &l.HelpText, &isDefault, &l.Config, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return nil, err
	}
	l.IsDefault = true
	return &l, nil
}

// CreateLayout 创建布局
func CreateLayout(name, description, author, helpText, config string, isDefault bool) (*ConsoleLayout, error) {
	db := GetDB()
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	defaultVal := 0
	if isDefault {
		// 先取消其他默认布局
		db.Exec("UPDATE console_layouts SET is_default = 0")
		defaultVal = 1
	}

	result, err := db.Exec(
		"INSERT INTO console_layouts (name, description, author, help_text, is_default, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		name, description, author, helpText, defaultVal, config, now, now,
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return &ConsoleLayout{
		ID:          int(id),
		Name:        name,
		Description: description,
		Author:      author,
		HelpText:    helpText,
		IsDefault:   isDefault,
		Config:      config,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// UpdateLayout 更新布局
func UpdateLayout(id int, name, description, author, helpText, config string, isDefault bool) error {
	db := GetDB()
	if db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	defaultVal := 0
	if isDefault {
		db.Exec("UPDATE console_layouts SET is_default = 0 WHERE id != ?", id)
		defaultVal = 1
	}

	_, err := db.Exec(
		"UPDATE console_layouts SET name = ?, description = ?, author = ?, help_text = ?, config = ?, is_default = ?, updated_at = ? WHERE id = ?",
		name, description, author, helpText, config, defaultVal, now, id,
	)
	return err
}

// DeleteLayout 删除布局
func DeleteLayout(id int) error {
	db := GetDB()
	if db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := db.Exec("DELETE FROM console_layouts WHERE id = ?", id)
	return err
}
