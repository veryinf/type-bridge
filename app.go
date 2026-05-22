package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/veryinf/easy-input/backend/automation"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:remote/dist
var remoteAssets embed.FS

var (
	CurrentVersion = "0.0.6"
	GitHubRepo    = "veryinf/easy-input"
	Port          = 5000
	RuleFilePath  = "hot-rule.txt"
)

type App struct {
	ctx context.Context
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
	ruleFile := filepath.Join(exeDir, RuleFilePath)

	if err := automation.LoadRules(ruleFile); err != nil {
		fmt.Printf("警告：加载规则文件失败 %v\n", err)
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
	mux.HandleFunc("/send", sendHandler)
	mux.HandleFunc("/send_enter", sendEnterHandler)
	mux.HandleFunc("/undo", undoHandler)
	mux.HandleFunc("/move_cursor", moveCursorHandler)
	mux.HandleFunc("/delete_pc", deletePCHandler)
	mux.HandleFunc("/logs", logsHandler)

	addr := fmt.Sprintf(":%d", port)
	fmt.Printf("手机访问地址：http://localhost%s/mobile.html\n", addr)
	http.ListenAndServe(addr, mux)
}

func sendHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}
	var data struct {
		Text string `json:"text"`
	}
	body, _ := io.ReadAll(r.Body)
	json.Unmarshal(body, &data)

	text := trimSpace(data.Text)
	if text != "" {
		lastOperation.Type = "text"
		lastOperation.Content = text
		replacedText := automation.ApplyRules(text)
		automation.PasteText(replacedText)
		addLog("text", fmt.Sprintf("发送文本: %s", text))
		fmt.Printf("原始文本：%s → 替换后：%s\n", text, replacedText)
	}

	jsonResp(w, "success", "")
}

func sendEnterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}
	lastOperation.Type = "enter"
	lastOperation.Content = ""
	automation.KeyTap("ENTER")
	addLog("enter", "发送回车")
	fmt.Println("执行回车操作，已记录历史")
	jsonResp(w, "success", "")
}

func undoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	if lastOperation.Type == "" {
		jsonResp(w, "failed", "无历史操作可撤销")
		return
	}

	recoverContent := lastOperation.Content

	if lastOperation.Type == "text" {
		replacedLen := len(automation.ApplyRules(lastOperation.Content))
		automation.UndoText(replacedLen)
	} else if lastOperation.Type == "enter" {
		automation.UndoEnter()
	}

	addLog("undo", "撤销操作")
	lastOperation.Type = ""
	lastOperation.Content = ""

	jsonRespWithContent(w, "success", "", recoverContent)
}

func moveCursorHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	var data struct {
		Direction string `json:"direction"`
	}
	body, _ := io.ReadAll(r.Body)
	json.Unmarshal(body, &data)

	direction := data.Direction
	if direction == "left" || direction == "up" || direction == "down" || direction == "right" {
		automation.KeyTap(strings.ToUpper(direction))
		addLog("cursor", fmt.Sprintf("光标移动: %s", direction))
		fmt.Printf("执行光标移动：%s\n", direction)
	}

	jsonResp(w, "success", "")
}

func deletePCHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	lastOperation.Type = "delete"
	lastOperation.Content = ""
	automation.KeyTap("BACKSPACE")
	addLog("delete", "删除")
	fmt.Println("执行PC端删除操作")
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
