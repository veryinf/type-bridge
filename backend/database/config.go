package database

import (
	"fmt"
	"strconv"
)

// GetConfig 获取配置值
func GetConfig(key string) (string, error) {
	if db == nil {
		return "", fmt.Errorf("数据库未初始化")
	}

	var value string
	err := db.QueryRow("SELECT value FROM config WHERE key = ?", key).Scan(&value)
	if err != nil {
		return "", err
	}
	return value, nil
}

// SetConfig 设置配置值（存在则更新，不存在则插入）
func SetConfig(key, value string) error {
	if db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := db.Exec(
		"INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
		key, value,
	)
	return err
}

// GetIntConfig 获取整数配置值，不存在或解析失败时返回默认值
func GetIntConfig(key string, defaultVal int) int {
	val, err := GetConfig(key)
	if err != nil {
		return defaultVal
	}
	n, err := strconv.Atoi(val)
	if err != nil {
		return defaultVal
	}
	return n
}
