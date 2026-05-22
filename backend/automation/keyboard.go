package automation

import (
	"github.com/go-vgo/robotgo"
)

func KeyTap(key string) {
	robotgo.KeyTap(key)
}

func PasteText(text string) {
	originalClipboard, _ := robotgo.ReadAll()
	
	robotgo.WriteAll(text)
	robotgo.KeyTap("v", "ctrl")
	
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
