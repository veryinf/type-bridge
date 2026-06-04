package automation

import (
	"time"

	"github.com/go-vgo/robotgo"
)

func KeyTap(key string, args ...interface{}) {
	robotgo.KeyTap(key, args...)
}

func KeyCombo(keys ...string) {
	if len(keys) == 0 {
		return
	}
	key := keys[0]
	mods := keys[1:]
	robotgo.KeyTap(key, mods)
}

func Delay(ms int) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

func PasteText(text string) {
	// 保存原始剪贴板
	original := platformReadClipboard()

	// 写入文本到剪贴板
	platformWriteClipboard(text)

	// 等待剪贴板写入完成
	time.Sleep(50 * time.Millisecond)

	// 执行粘贴
	platformPaste()

	// 等待粘贴完成
	time.Sleep(50 * time.Millisecond)

	// 恢复原始剪贴板
	if original != "" {
		platformWriteClipboard(original)
	}
}

func UndoText(count int) {
	if count > 0 {
		for i := 0; i < count; i++ {
			robotgo.KeyTap("backspace")
		}
	}
}

func UndoEnter() {
	robotgo.KeyTap("backspace")
}
