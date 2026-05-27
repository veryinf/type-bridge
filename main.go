package main

import (
	"embed"
	"fmt"
	"net"
	"os"
	"path/filepath"

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

	// 初始化数据库（用于读取端口等配置）
	dbPath := filepath.Join(exeDir, "db", "typebridge.db")
	if err := database.Init(dbPath); err != nil {
		fmt.Printf("警告：初始化数据库失败 %v\n", err)
	}

	// 读取端口配置
	port := database.GetIntConfig("httpPort", Port)
	if port > 0 {
		Port = port
	}

	// 创建 Wails 应用
	app := application.New(application.Options{
		Name:        "Type Bridge",
		Description: "手机电脑输入同步",
		Icon:        appIconPNG,
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Services: []application.Service{
			application.NewService(&App{}),
		},
		Mac: application.MacOptions{
			ActivationPolicy: application.ActivationPolicyAccessory,
		},
	})

	// 环境检测：端口是否可用
	if err := checkPortAvailable(port); err != nil {
		app.Dialog.Error().
			SetTitle("Type Bridge - 启动失败").
			SetMessage(fmt.Sprintf("端口 %d 已被其他程序占用，请关闭占用该端口的程序后重试。\n\n错误详情: %v", port, err)).
			Show()
		os.Exit(1)
	}

	// 创建主窗口
	mainWindow = app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:  "Type Bridge - 手机电脑输入同步",
		Width:  1024,
		Height: 700,
		URL:    "/",
	})

	// 窗口关闭时最小化到托盘（而非退出）
	mainWindow.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		minimize, _ := database.GetConfig("minimizeToTray")
		if minimize == "" || minimize == "true" {
			mainWindow.Hide()
			e.Cancel()
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
