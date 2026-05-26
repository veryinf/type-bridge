package database

import (
	"fmt"
	"time"
)

// LogEntry 日志条目
type LogEntry struct {
	Time    string `json:"time"`
	Type    string `json:"type"`
	Content string `json:"content"`
}

// AddLog 添加日志
func AddLog(logType, content string) error {
	if db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	now := time.Now()
	_, err := db.Exec(
		"INSERT INTO logs (time, type, content) VALUES (?, ?, ?)",
		now.Format("2006-01-02 15:04:05"),
		logType,
		content,
	)
	return err
}

// GetLogs 获取最近的日志
func GetLogs(limit int) ([]LogEntry, error) {
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	if limit <= 0 {
		limit = 100
	}

	rows, err := db.Query(
		"SELECT time, type, content FROM logs ORDER BY id DESC LIMIT ?",
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []LogEntry
	for rows.Next() {
		var entry LogEntry
		if err := rows.Scan(&entry.Time, &entry.Type, &entry.Content); err != nil {
			return nil, err
		}
		logs = append(logs, entry)
	}

	// 反转顺序，使最新的在最后
	for i, j := 0, len(logs)-1; i < j; i, j = i+1, j-1 {
		logs[i], logs[j] = logs[j], logs[i]
	}

	return logs, nil
}

// CleanOldLogs 清理超出限制的旧日志
func CleanOldLogs(keepCount int) error {
	if db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	if keepCount <= 0 {
		keepCount = 100
	}

	_, err := db.Exec(`
		DELETE FROM logs WHERE id NOT IN (
			SELECT id FROM logs ORDER BY id DESC LIMIT ?
		)
	`, keepCount)
	return err
}
