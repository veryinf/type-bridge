package server

import (
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/veryinf/easy-input/backend/automation"
)

var LastOperation struct {
	Type    string
	Content string
}

func GetLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

func Start(port int, remoteFS fs.FS) error {
	fileServer := http.FileServer(http.FS(remoteFS))

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

	addr := fmt.Sprintf(":%d", port)
	return http.ListenAndServe(addr, mux)
}

func sendHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	var data struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		jsonResp(w, "failed", err.Error())
		return
	}

	text := strings.TrimSpace(data.Text)
	if text != "" {
		LastOperation.Type = "text"
		LastOperation.Content = text
		replacedText := automation.ApplyRules(text)
		automation.PasteText(replacedText)
		fmt.Printf("原始文本：%s → 替换后：%s\n", text, replacedText)
	}

	jsonResp(w, "success", "")
}

func sendEnterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	LastOperation.Type = "enter"
	LastOperation.Content = ""
	automation.KeyTap("ENTER")
	fmt.Println("执行回车操作，已记录历史")
	jsonResp(w, "success", "")
}

func undoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	if LastOperation.Type == "" {
		jsonResp(w, "failed", "无历史操作可撤销")
		return
	}

	recoverContent := LastOperation.Content

	if LastOperation.Type == "text" {
		replacedLen := len(automation.ApplyRules(LastOperation.Content))
		automation.UndoText(replacedLen)
	} else if LastOperation.Type == "enter" {
		automation.UndoEnter()
	}

	LastOperation.Type = ""
	LastOperation.Content = ""

	jsonRespWithContent(w, "success", "", recoverContent)
}

func moveCursorHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	var data struct {
		Direction string `json:"direction"`
	}
	json.NewDecoder(r.Body).Decode(&data)

	direction := data.Direction
	if direction == "left" || direction == "up" || direction == "down" || direction == "right" {
		automation.KeyTap(strings.ToUpper(direction))
		fmt.Printf("执行光标移动：%s\n", direction)
	}

	jsonResp(w, "success", "")
}

func deletePCHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		return
	}

	LastOperation.Type = "delete"
	LastOperation.Content = ""
	automation.KeyTap("BACKSPACE")
	fmt.Println("执行PC端删除操作")
	jsonResp(w, "success", "")
}

func jsonResp(w http.ResponseWriter, status, msg string) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": status, "msg": msg})
}

func jsonRespWithContent(w http.ResponseWriter, status, msg, content string) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": status, "msg": msg, "content": content})
}

func CheckUpdate(currentVersion, repo string) {
	fmt.Println("正在检查更新...")
	url := fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", repo)

	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		fmt.Printf("⚠️  更新检查失败：%v（忽略，继续运行）\n\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		fmt.Println("⚠️  更新检查失败：无法获取最新版本信息\n")
		return
	}

	body, _ := io.ReadAll(resp.Body)
	bodyStr := string(body)

	tagName := extractJSON(bodyStr, "tag_name")
	latestVersion := strings.TrimPrefix(tagName, "v")
	htmlUrl := extractJSON(bodyStr, "html_url")
	bodyText := extractJSON(bodyStr, "body")

	if latestVersion == "" {
		fmt.Println("⚠️  更新检查失败：无法解析版本信息\n")
		return
	}

	if compareVersion(latestVersion, currentVersion) > 0 {
		bodyPreview := bodyText
		if len(bodyPreview) > 200 {
			bodyPreview = bodyPreview[:200] + "..."
		}
		fmt.Printf("\n🎉 发现新版本！当前版本 v%s → 最新版本 v%s\n", currentVersion, latestVersion)
		fmt.Printf("📥 下载地址：%s\n", htmlUrl)
		fmt.Printf("📝 更新日志：%s\n\n", bodyPreview)
	} else {
		fmt.Println("✅ 当前已是最新版本！\n")
	}
}

func extractJSON(jsonStr, key string) string {
	start := strings.Index(jsonStr, `"`+key+`"`)
	if start == -1 {
		return ""
	}
	remain := jsonStr[start:]
	colonPos := strings.Index(remain, ":")
	if colonPos == -1 {
		return ""
	}
	remain = remain[colonPos+1:]
	quotePos := strings.Index(remain, `"`)
	if quotePos == -1 {
		return ""
	}
	remain = remain[quotePos+1:]
	end := 0
	escape := false
	for end < len(remain) {
		c := remain[end]
		if escape {
			escape = false
		} else if c == '\\' {
			escape = true
		} else if c == '"' {
			break
		}
		end++
	}
	return remain[:end]
}

func compareVersion(v1, v2 string) int {
	v1Parts := strings.Split(v1, ".")
	v2Parts := strings.Split(v2, ".")

	for i := 0; i < len(v1Parts) && i < len(v2Parts); i++ {
		var n1, n2 int
		fmt.Sscanf(v1Parts[i], "%d", &n1)
		fmt.Sscanf(v2Parts[i], "%d", &n2)
		if n1 > n2 {
			return 1
		}
		if n1 < n2 {
			return -1	}
	}
	return 0
}
