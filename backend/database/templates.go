package database

import (
	"fmt"
	"time"
)

// Template 模板数据结构
type Template struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Content   string `json:"content"`
	Type      string `json:"type"` // "text" | "shortcut"
	SortOrder int    `json:"sort_order"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

// GetAllTemplates 获取所有模板
func GetAllTemplates() ([]Template, error) {
	db := GetDB()
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	rows, err := db.Query("SELECT id, name, content, type, sort_order, created_at, updated_at FROM templates ORDER BY sort_order ASC, id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []Template
	for rows.Next() {
		var t Template
		if err := rows.Scan(&t.ID, &t.Name, &t.Content, &t.Type, &t.SortOrder, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

// GetTemplateByID 根据ID获取模板
func GetTemplateByID(id int) (*Template, error) {
	db := GetDB()
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	var t Template
	err := db.QueryRow("SELECT id, name, content, type, sort_order, created_at, updated_at FROM templates WHERE id = ?", id).
		Scan(&t.ID, &t.Name, &t.Content, &t.Type, &t.SortOrder, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// CreateTemplate 创建模板
func CreateTemplate(name, content, templateType string) (*Template, error) {
	db := GetDB()
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	// 获取当前最大排序值
	var maxOrder int
	db.QueryRow("SELECT COALESCE(MAX(sort_order), 0) FROM templates").Scan(&maxOrder)

	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := db.Exec(
		"INSERT INTO templates (name, content, type, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
		name, content, templateType, maxOrder+1, now, now,
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return &Template{
		ID:        int(id),
		Name:      name,
		Content:   content,
		Type:      templateType,
		SortOrder: maxOrder + 1,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// UpdateTemplate 更新模板
func UpdateTemplate(id int, name, content, templateType string) error {
	db := GetDB()
	if db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	_, err := db.Exec(
		"UPDATE templates SET name = ?, content = ?, type = ?, updated_at = ? WHERE id = ?",
		name, content, templateType, now, id,
	)
	return err
}

// DeleteTemplate 删除模板
func DeleteTemplate(id int) error {
	db := GetDB()
	if db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := db.Exec("DELETE FROM templates WHERE id = ?", id)
	return err
}

// UpdateTemplateOrder 更新模板排序
func UpdateTemplateOrder(id int, sortOrder int) error {
	db := GetDB()
	if db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := db.Exec("UPDATE templates SET sort_order = ?, updated_at = ? WHERE id = ?",
		sortOrder, time.Now().Format("2006-01-02 15:04:05"), id)
	return err
}
