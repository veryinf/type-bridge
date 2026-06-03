package main

import (
	"embed"
	"flag"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/veryinf/easy-input/backend/database"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var appIconPNG []byte

var mainWindow application.Window

func main() {
	exeDir := getExecDir()

	// 解析命令行参数
	portFlag := flag.Int("port", 0, "HTTP 服务端口（覆盖数据库配置）")
	flag.Parse()

	// 创建 Wails 应用（先创建以获取 dialog 能力）
	myApp := &App{}
	app := application.New(application.Options{
		Name:        "Type Bridge",
		Description: "手机电脑输入同步",
		Icon:        appIconPNG,
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Services: []application.Service{
			application.NewService(myApp),
		},
		Mac: application.MacOptions{
			ActivationPolicy: application.ActivationPolicyAccessory,
		},
	})
	myApp.wails = app

	// 初始化数据库（用于读取端口等配置）
	dbPath := filepath.Join(exeDir, "db", "typebridge.db")
	if err := database.Init(dbPath); err != nil {
		app.Dialog.Error().
			SetTitle("Type Bridge - 启动失败").
			SetMessage(fmt.Sprintf("数据库初始化失败，请检查应用目录权限。\n\n错误详情: %v", err)).
			Show()
		os.Exit(1)
	}

	// 确定端口：命令行 > 数据库 > 默认值
	port := Port
	if *portFlag > 0 {
		port = *portFlag
	} else if dbPort := database.GetIntConfig("httpPort", 0); dbPort > 0 {
		port = dbPort
	}
	Port = port

	// 环境检测：端口是否可用
	if err := checkPortAvailable(port); err != nil {
		app.Dialog.Error().
			SetTitle("Type Bridge - 启动失败").
			SetMessage(fmt.Sprintf("端口 %d 已被其他程序占用，请关闭占用该端口的程序后重试。\n\n错误详情: %v", port, err)).
			Show()
		os.Exit(1)
	}

	// 开发模式下等待 Vite dev server 就绪
	waitForDevServer()

	// 创建主窗口
	mainWindow = app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  "Type Bridge - 手机电脑输入同步",
		Width:  1024,
		Height: 700,
		URL:    "/",
	})

	// 窗口关闭时根据配置决定行为
	mainWindow.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		minimize, _ := database.GetConfig("minimizeToTray")
		if minimize == "" || minimize == "true" {
			mainWindow.Hide()
			e.Cancel()
		} else {
			app.Quit()
		}
	})

	// 系统托盘
	setupSystemTray(app)

	err := app.Run()
	if err != nil {
		println("Error:", err.Error())
		os.Exit(1)
	}
}

func setupSystemTray(app *application.App) {
	systemTray := app.SystemTray.New()
	systemTray.SetIcon(appIconPNG)
	systemTray.SetTooltip("Type Bridge - 手机电脑输入同步")

	// 左键点击切换主窗口显示/隐藏
	systemTray.AttachWindow(mainWindow)

	// 右键菜单
	menu := app.NewMenu()
	menu.Add("显示窗口").OnClick(func(ctx *application.Context) {
		mainWindow.Show()
	})
	menu.AddSeparator()
	menu.Add("退出").OnClick(func(ctx *application.Context) {
		app.Quit()
	})
	systemTray.SetMenu(menu)
}

func checkPortAvailable(port int) error {
	ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		return err
	}
	ln.Close()
	return nil
}

// waitForDevServer 在开发模式下等待 Vite dev server 就绪。
// Wails v3 内置的等待时间较短（5秒），Vite 冷启动可能需要更长时间。
func waitForDevServer() {
	devServerURL := os.Getenv("FRONTEND_DEVSERVER_URL")
	if devServerURL == "" {
		return
	}

	u, err := url.Parse(devServerURL)
	if err != nil {
		return
	}

	client := http.Client{Timeout: 2 * time.Second}
	addr := u.Host
	fmt.Printf("等待前端开发服务器就绪 %s ...\n", addr)

	for i := 0; i < 60; i++ {
		conn, err := net.DialTimeout("tcp", addr, 1*time.Second)
		if err == nil {
			conn.Close()
			fmt.Println("前端开发服务器已就绪")
			return
		}
		time.Sleep(500 * time.Millisecond)
		// 同时尝试 HTTP 连接
		if i%4 == 0 {
			resp, err := client.Get(devServerURL)
			if err == nil {
				resp.Body.Close()
				fmt.Println("前端开发服务器已就绪")
				return
			}
		}
	}

	fmt.Println("警告：前端开发服务器等待超时，继续启动...")
}
