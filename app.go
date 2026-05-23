package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/veryinf/easy-input/backend/automation"
	"github.com/veryinf/easy-input/backend/database"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:remote/dist
var remoteAssets embed.FS

var (
	CurrentVersion = "0.0.6"
	GitHubRepo    = "veryinf/easy-input"
	Port          = 5000
)

type App struct {
	ctx context.Context
}

type Command struct {
	Action     string   `json:"action"`
	Text       string   `json:"text,omitempty"`
	Key        string   `json:"key,omitempty"`
	Keys       []string `json:"keys,omitempty"`
	ApplyRules bool     `json:"applyRules,omitempty"`
	Delay      int      `json:"ms,omitempty"`
	Count      int      `json:"count,omitempty"`
}

type ExecuteRequest struct {
	Commands []Command `json:"commands"`
}

type UndoResponse struct {
	Status  string `json:"status"`
	Msg     string `json:"msg"`
	Content string `json:"content"`
}

var lastOperation struct {
	Type    string
	Content string
}

// ActionGroup 操作按钮分组
type ActionGroup struct {
	Title   string         `json:"title"`
	Columns int            `json:"columns,omitempty"`
	Buttons []ButtonConfig `json:"buttons"`
}

// ConsoleConfig 控制台配置（从 default_console.json 加载）
type ConsoleConfig struct {
	HelpText     string               `json:"help_text"`
	InputButtons []ButtonConfig       `json:"inputButtons"`
	ActionGroups []ActionGroup        `json:"actionGroups"`
	Rules        []automation.RuleConfig `json:"rules"`
}

// ButtonConfig 按钮配置
type ButtonConfig struct {
	ID       string    `json:"id"`
	Label    string    `json:"label"`
	Variant  string    `json:"variant,omitempty"`
	Commands []Command `json:"commands,omitempty"`
}

var (
	consoleConfig ConsoleConfig
	consoleMu     sync.RWMutex
	consoleFile   = "default_console.json"
)

type LogEntry struct {
	Time    string `json:"time"`
	Type    string `json:"type"`
	Content string `json:"content"`
}

var logs []LogEntry
var logsMutex sync.Mutex

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	exeDir := getExecDir()

	// 加载控制台配置
	if err := a.loadConsoleConfig(); err != nil {
		fmt.Printf("警告：加载控制台配置失败 %v\n", err)
	} else {
		fmt.Println("控制台配置加载成功")
	}

	// 从控制台配置加载替换规则
	if err := automation.LoadRulesFromConfig(consoleConfig.Rules); err != nil {
		fmt.Printf("警告：加载替换规则失败 %v\n", err)
	}

	// 初始化数据库
	dbPath := filepath.Join(exeDir, "db", "typebridge.db")
	if err := database.Init(dbPath); err != nil {
		fmt.Printf("警告：初始化数据库失败 %v\n", err)
	} else {
		fmt.Println("数据库初始化成功")
	}

	go StartServer(Port)

	fmt.Printf("已加载 %d 条替换规则\n", len(automation.Rules))
	fmt.Printf("当前版本 v%s，项目地址：https://github.com/%s\n", CurrentVersion, GitHubRepo)
}

func (a *App) GetAccessURL() string {
	return fmt.Sprintf("http://localhost:%d/mobile.html", Port)
}

func (a *App) GetVersion() string {
	return CurrentVersion
}

func (a *App) GetServerPort() int {
	return Port
}

func (a *App) GetLogs() []LogEntry {
	logsMutex.Lock()
	defer logsMutex.Unlock()
	result := make([]LogEntry, len(logs))
	copy(result, logs)
	return result
}

func (a *App) SendText(text string) {
	text = trimSpace(text)
	if text != "" {
		lastOperation.Type = "text"
		lastOperation.Content = text
		replacedText := automation.ApplyRules(text)
		automation.PasteText(replacedText)
		fmt.Printf("原始文本：%s → 替换后：%s\n", text, replacedText)
	}
}

func (a *App) SendEnter() {
	lastOperation.Type = "enter"
	lastOperation.Content = ""
	automation.KeyTap("ENTER")
	fmt.Println("执行回车操作，已记录历史")
}

func (a *App) Undo() UndoResponse {
	if lastOperation.Type == "" {
		return UndoResponse{Status: "failed", Msg: "无历史操作可撤销"}
	}

	recoverContent := lastOperation.Content

	if lastOperation.Type == "text" {
		replacedLen := len(automation.ApplyRules(lastOperation.Content))
		automation.UndoText(replacedLen)
	} else if lastOperation.Type == "enter" {
		automation.UndoEnter()
	}

	lastOperation.Type = ""
	lastOperation.Content = ""

	return UndoResponse{Status: "success", Content: recoverContent}
}

func (a *App) MoveCursor(direction string) {
	if direction == "left" || direction == "up" || direction == "down" || direction == "right" {
		automation.KeyTap(strings.ToUpper(direction))
		fmt.Printf("执行光标移动：%s\n", direction)
	}
}

func (a *App) DeletePC() {
	lastOperation.Type = "delete"
	lastOperation.Content = ""
	automation.KeyTap("BACKSPACE")
	fmt.Println("执行PC端删除操作")
}

func (a *App) ShowWindow() {
	wailsRuntime.WindowShow(a.ctx)
}

func (a *App) QuitApp() {
	wailsRuntime.Quit(a.ctx)
}

func getExecDir() string {
	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Dir(filename)
	if !contains(dir, "\\") {
		dir, _ = os.Getwd()
	}
	if dir == "" {
		dir, _ = os.Getwd()
	}
	return dir
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func StartServer(port int) {
	remoteDist, err := fs.Sub(remoteAssets, "remote/dist")
	if err != nil {
		fmt.Printf("错误：无法加载远程界面资源 %v\n", err)
		return
	}
	fileServer := http.FileServer(http.FS(remoteDist))

	mux := http.NewServeMux()
	mux.HandleFunc("/mobile.html", func(w http.ResponseWriter, r *http.Request) {
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})
	mux.Handle("/", fileServer)
	mux.HandleFunc("/api/v1/execute", executeHandler)
	mux.HandleFunc("/api/v1/logs", logsHandler)

	// 模板 API
	mux.HandleFunc("/api/v1/templates", templatesHandler)
	mux.HandleFunc("/api/v1/templates/", templateHandler)

	// 控制台配置 API
	mux.HandleFunc("/api/v1/console", consoleHandler)

	addr := fmt.Sprintf(":%d", port)
	fmt.Printf("手机访问地址：http://localhost%s/mobile.html\n", addr)
	http.ListenAndServe(addr, mux)
}

func executeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	var req ExecuteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonResp(w, "failed", "请求格式错误")
		return
	}

	for _, cmd := range req.Commands {
		switch cmd.Action {
		case "text":
			text := cmd.Text
			if text == "" {
				continue
			}
			if cmd.ApplyRules {
				text = automation.ApplyRules(text)
			}
			lastOperation.Type = "text"
			lastOperation.Content = cmd.Text
			automation.PasteText(text)
			addLog("text", fmt.Sprintf("发送文本: %s", cmd.Text))

		case "key":
			if cmd.Key == "" {
				continue
			}
			automation.KeyTap(cmd.Key)
			addLog("key", fmt.Sprintf("按键: %s", cmd.Key))

		case "combo":
			if len(cmd.Keys) == 0 {
				continue
			}
			automation.KeyCombo(cmd.Keys...)
			addLog("combo", fmt.Sprintf("组合键: %v", cmd.Keys))

		case "delay":
			if cmd.Delay > 0 {
				automation.Delay(cmd.Delay)
			}

		case "undo":
			if lastOperation.Type == "" {
				continue
			}
			if lastOperation.Type == "text" {
				replacedLen := len(automation.ApplyRules(lastOperation.Content))
				automation.UndoText(replacedLen)
			} else if lastOperation.Type == "enter" {
				automation.UndoEnter()
			}
			addLog("undo", "撤销操作")
			lastOperation.Type = ""
			lastOperation.Content = ""
		}
	}

	jsonResp(w, "success", "")
}

func logsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	logsMutex.Lock()
	defer logsMutex.Unlock()
	json.NewEncoder(w).Encode(logs)
}

func addLog(logType, content string) {
	logsMutex.Lock()
	defer logsMutex.Unlock()
	now := time.Now()
	entry := LogEntry{
		Time:    now.Format("15:04:05"),
		Type:    logType,
		Content: content,
	}
	logs = append(logs, entry)
	if len(logs) > 100 {
		logs = logs[1:]
	}
}

func jsonResp(w http.ResponseWriter, status, msg string) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"status":"%s","msg":"%s"}`, status, msg)
}

func jsonRespWithContent(w http.ResponseWriter, status, msg, content string) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"status":"%s","msg":"%s","content":"%s"}`, status, msg, content)
}

// templatesHandler 处理 /api/v1/templates
func templatesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		templates, err := database.GetAllTemplates()
		if err != nil {
			jsonResp(w, "failed", err.Error())
			return
		}
		json.NewEncoder(w).Encode(templates)

	case http.MethodPost:
		var req struct {
			Name    string `json:"name"`
			Content string `json:"content"`
			Type    string `json:"type"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonResp(w, "failed", "请求格式错误")
			return
		}
		if req.Name == "" || req.Content == "" {
			jsonResp(w, "failed", "名称和内容不能为空")
			return
		}
		if req.Type == "" {
			req.Type = "text"
		}
		template, err := database.CreateTemplate(req.Name, req.Content, req.Type)
		if err != nil {
			jsonResp(w, "failed", err.Error())
			return
		}
		json.NewEncoder(w).Encode(template)

	default:
		jsonResp(w, "failed", "不支持的请求方法")
	}
}

// templateHandler 处理 /api/v1/templates/{id}
func templateHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// 提取 ID
	path := r.URL.Path
	prefix := "/api/v1/templates/"
	if !strings.HasPrefix(path, prefix) {
		jsonResp(w, "failed", "无效的路径")
		return
	}
	idStr := strings.TrimPrefix(path, prefix)
	idStr = strings.TrimSuffix(idStr, "/")
	if idStr == "" {
		jsonResp(w, "failed", "缺少模板ID")
		return
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		jsonResp(w, "failed", "无效的模板ID")
		return
	}

	switch r.Method {
	case http.MethodGet:
		template, err := database.GetTemplateByID(id)
		if err != nil {
			jsonResp(w, "failed", "模板不存在")
			return
		}
		json.NewEncoder(w).Encode(template)

	case http.MethodPut:
		var req struct {
			Name    string `json:"name"`
			Content string `json:"content"`
			Type    string `json:"type"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonResp(w, "failed", "请求格式错误")
			return
		}
		if err := database.UpdateTemplate(id, req.Name, req.Content, req.Type); err != nil {
			jsonResp(w, "failed", err.Error())
			return
		}
		jsonResp(w, "success", "")

	case http.MethodDelete:
		if err := database.DeleteTemplate(id); err != nil {
			jsonResp(w, "failed", err.Error())
			return
		}
		jsonResp(w, "success", "")

	default:
		jsonResp(w, "failed", "不支持的请求方法")
	}
}

// consoleHandler 处理 /api/v1/console
func consoleHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		consoleMu.RLock()
		defer consoleMu.RUnlock()
		json.NewEncoder(w).Encode(consoleConfig)

	case http.MethodPut:
		var config ConsoleConfig
		if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
			jsonResp(w, "failed", "请求格式错误")
			return
		}
		if err := saveConsoleConfig(&config); err != nil {
			jsonResp(w, "failed", err.Error())
			return
		}
		jsonResp(w, "success", "")

	default:
		jsonResp(w, "failed", "不支持的请求方法")
	}
}

func (a *App) loadConsoleConfig() error {
	exeDir := getExecDir()
	filePath := filepath.Join(exeDir, consoleFile)

	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("读取控制台配置文件失败: %w", err)
	}

	consoleMu.Lock()
	defer consoleMu.Unlock()
	if err := json.Unmarshal(data, &consoleConfig); err != nil {
		return fmt.Errorf("解析控制台配置文件失败: %w", err)
	}
	return nil
}

func saveConsoleConfig(config *ConsoleConfig) error {
	exeDir := getExecDir()
	filePath := filepath.Join(exeDir, consoleFile)

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化控制台配置失败: %w", err)
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("写入控制台配置文件失败: %w", err)
	}

	consoleMu.Lock()
	consoleConfig = *config
	consoleMu.Unlock()

	automation.LoadRulesFromConfig(config.Rules)
	return nil
}

// GetConsoleConfig Wails 绑定：获取控制台配置
func (a *App) GetConsoleConfig() ConsoleConfig {
	consoleMu.RLock()
	defer consoleMu.RUnlock()
	return consoleConfig
}

// SaveConsoleConfig Wails 绑定：保存控制台配置
func (a *App) SaveConsoleConfig(config ConsoleConfig) error {
	return saveConsoleConfig(&config)
}

func trimSpace(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}
	return s[start:end]
}
