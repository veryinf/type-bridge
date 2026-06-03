//go:build darwin

package automation

/*
#cgo LDFLAGS: -framework CoreGraphics
#include <CoreGraphics/CoreGraphics.h>
#include <unistd.h>

void macPaste() {
	CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateCombinedSessionState);
	if (!source) return;

	CGEventRef keyDown = CGEventCreateKeyboardEvent(source, (CGKeyCode)9, true);
	CGEventSetFlags(keyDown, kCGEventFlagMaskCommand);
	CGEventPost(kCGAnnotatedSessionEventTap, keyDown);
	CFRelease(keyDown);

	usleep(10000);

	CGEventRef keyUp = CGEventCreateKeyboardEvent(source, (CGKeyCode)9, false);
	CGEventSetFlags(keyUp, kCGEventFlagMaskCommand);
	CGEventPost(kCGAnnotatedSessionEventTap, keyUp);
	CFRelease(keyUp);

	CFRelease(source);
}
*/
import "C"

func platformPaste() {
	C.macPaste()
}
