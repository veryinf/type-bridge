package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/veryinf/easy-input/backend/automation"
	"github.com/veryinf/easy-input/backend/database"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:remote/dist
var remoteAssets embed.FS

//go:embed console.json
var defaultConsoleJSON []byte

var (
	CurrentVersion = "DEV"
	GitHubRepo     = "veryinf/easy-input"
	Port           = 5000
)

type App struct {
	ctx    context.Context
	wails  *application.App
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

// ConsoleConfig 控制台配置（从 console.json 加载）
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
	consoleFile = "console.json"
	httpServer  *http.Server
	serverMu    sync.Mutex
)

func NewApp() *App {
	return &App{}
}

// ServiceName 返回服务名称（Wails v3 可选接口）
func (a *App) ServiceName() string {
	return "App"
}

// ServiceStartup 应用启动时调用（替代 v2 的 OnStartup）
func (a *App) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	a.ctx = ctx

	// 加载控制台配置并初始化替换规则
	config, err := readConsoleConfig()
	if err != nil {
		a.showDialog("Type Bridge - 配置错误",
			fmt.Sprintf("加载控制台配置失败，将使用默认配置。\n\n错误详情: %v", err))
	}

	if err := automation.LoadRulesFromConfig(config.Rules); err != nil {
		a.showDialog("Type Bridge - 规则错误",
			fmt.Sprintf("加载替换规则失败。\n\n错误详情: %v", err))
	}

	go startHTTPServer(Port)

	fmt.Printf("当前版本 v%s，项目地址：https://github.com/%s\n", CurrentVersion, GitHubRepo)

	return nil
}

// showDialog 显示错误对话框
func (a *App) showDialog(title, message string) {
	if a.wails != nil {
		a.wails.Dialog.Error().
			SetTitle(title).
			SetMessage(message).
			Show()
	}
}

// ServiceShutdown 应用关闭时调用
func (a *App) ServiceShutdown() error {
	serverMu.Lock()
	srv := httpServer
	serverMu.Unlock()

	if srv != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		srv.Shutdown(ctx)
	}

	database.Close()
	return nil
}

func (a *App) GetAccessURL() string {
	ips := getAllLanIPs()
	ip := "localhost"
	if len(ips) > 0 {
		ip = ips[0]
	}
	return fmt.Sprintf("http://%s:%d", ip, Port)
}

func (a *App) GetLanIPs() []string {
	return getAllLanIPs()
}

func getAllLanIPs() []string {
	ifaces, err := net.Interfaces()
	if err != nil {
		return []string{"localhost"}
	}
	var ips []string
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 {
			continue
		}
		if iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			if ipNet, ok := addr.(*net.IPNet); ok && ipNet.IP.To4() != nil {
				ips = append(ips, ipNet.IP.String())
			}
		}
	}
	if len(ips) == 0 {
		return []string{"localhost"}
	}
	return ips
}

func (a *App) GetVersion() string {
	return CurrentVersion
}

func (a *App) GetServerPort() int {
	return Port
}

func (a *App) GetMaxLogCount() int {
	return database.GetIntConfig("maxLogCount", 100)
}

func (a *App) SetMaxLogCount(count int) error {
	if count < 0 {
		return fmt.Errorf("最大记录数不能为负数")
	}
	return database.SetConfig("maxLogCount", strconv.Itoa(count))
}

func (a *App) GetMinimizeToTray() bool {
	v, err := database.GetConfig("minimizeToTray")
	if err != nil {
		return true
	}
	return v == "" || v == "true"
}

func (a *App) SetMinimizeToTray(v bool) {
	database.SetConfig("minimizeToTray", strconv.FormatBool(v))
}

func (a *App) GetLogs() []database.LogEntry {
	maxCount := database.GetIntConfig("maxLogCount", 100)
	logs, err := database.GetLogs(maxCount)
	if err != nil {
		fmt.Printf("获取日志失败: %v\n", err)
		return nil
	}
	return logs
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
	if mainWindow != nil {
		mainWindow.Show()
	}
}

func (a *App) QuitApp() {
	application.Get().Quit()
}

func getExecDir() string {
	exePath, err := os.Executable()
	if err != nil {
		dir, _ := os.Getwd()
		return dir
	}
	return filepath.Dir(exePath)
}

func startHTTPServer(port int) {
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
	mux.HandleFunc("/api/v1/templates", templatesHandler)
	mux.HandleFunc("/api/v1/templates/", templateHandler)
	mux.HandleFunc("/api/v1/console", consoleHandler)
	mux.HandleFunc("/api/v1/version", versionHandler)

	addr := fmt.Sprintf(":%d", port)
	srv := &http.Server{Addr: addr, Handler: mux}

	serverMu.Lock()
	httpServer = srv
	serverMu.Unlock()

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		fmt.Printf("HTTP 服务器错误: %v\n", err)
	}
}

// SetServerPort Wails 绑定：修改服务端口并重启 HTTP 服务器
func (a *App) SetServerPort(newPort int) error {
	if newPort < 1 || newPort > 65535 {
		return fmt.Errorf("端口范围无效，应为 1-65535")
	}

	if err := database.SetConfig("httpPort", strconv.Itoa(newPort)); err != nil {
		return fmt.Errorf("保存端口配置失败: %w", err)
	}

	serverMu.Lock()
	srv := httpServer
	serverMu.Unlock()

	if srv != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		srv.Shutdown(ctx)
	}

	Port = newPort
	go startHTTPServer(newPort)

	return nil
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
	maxCount := database.GetIntConfig("maxLogCount", 100)
	logs, err := database.GetLogs(maxCount)
	if err != nil {
		json.NewEncoder(w).Encode([]database.LogEntry{})
		return
	}
	json.NewEncoder(w).Encode(logs)
}

func versionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"version": CurrentVersion})
}

func addLog(logType, content string) {
	if err := database.AddLog(logType, content); err != nil {
		fmt.Printf("写入日志失败: %v\n", err)
	}
}

func jsonResp(w http.ResponseWriter, status, msg string) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"status":"%s","msg":"%s"}`, status, msg)
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
		config, err := readConsoleConfig()
		if err != nil {
			jsonResp(w, "failed", err.Error())
			return
		}
		json.NewEncoder(w).Encode(config)

	default:
		jsonResp(w, "failed", "不支持的请求方法")
	}
}

// readConsoleConfig 从文件读取控制台配置。文件不存在时释放内置默认配置。
func readConsoleConfig() (ConsoleConfig, error) {
	exeDir := getExecDir()
	filePath := filepath.Join(exeDir, consoleFile)

	data, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Printf("配置文件不存在，从内置默认配置释放: %s\n", filePath)
		if err := os.WriteFile(filePath, defaultConsoleJSON, 0644); err != nil {
			return ConsoleConfig{}, fmt.Errorf("释放默认配置文件失败: %w", err)
		}
		data = defaultConsoleJSON
	}

	var config ConsoleConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return ConsoleConfig{}, fmt.Errorf("解析控制台配置文件失败: %w", err)
	}
	return config, nil
}

// GetConsoleConfig Wails 绑定：获取控制台配置
func (a *App) GetConsoleConfig() ConsoleConfig {
	config, err := readConsoleConfig()
	if err != nil {
		fmt.Printf("读取控制台配置失败: %v\n", err)
		return ConsoleConfig{}
	}
	return config
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
