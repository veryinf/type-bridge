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
	originalClipboard, _ := robotgo.ReadAll()

	robotgo.WriteAll(text)
	platformPaste()

	if originalClipboard != "" {
		robotgo.WriteAll(originalClipboard)
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
