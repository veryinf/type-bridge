//go:build !darwin

package automation

import "github.com/go-vgo/robotgo"

func platformPaste() {
	robotgo.KeyTap("v", "ctrl")
}
