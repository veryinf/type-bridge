//go:build !darwin

package automation

import "github.com/go-vgo/robotgo"

func platformPaste() {
	robotgo.KeyTap("v", "ctrl")
}

func platformWriteClipboard(text string) {
	robotgo.WriteAll(text)
}

func platformReadClipboard() string {
	s, _ := robotgo.ReadAll()
	return s
}
