//go:build darwin

package automation

/*
#cgo LDFLAGS: -framework CoreGraphics -framework AppKit
#include <CoreGraphics/CoreGraphics.h>
#include <objc/runtime.h>
#include <objc/message.h>
#include <unistd.h>

// Pasteboard type string
static SEL selGeneralPasteboard = NULL;
static SEL selClearContents = NULL;
static SEL selWriteObjects = NULL;
static SEL selStringForType = NULL;
static SEL selNSStringWithUTF8String = NULL;
static SEL selUTF8String = NULL;
static Class clsNSPasteboard = NULL;
static Class clsNSString = NULL;
static Class clsNSArray = NULL;
static id typeString = NULL;

static void initPasteboard() {
    if (selGeneralPasteboard) return;
    selGeneralPasteboard = sel_registerName("generalPasteboard");
    selClearContents = sel_registerName("clearContents");
    selWriteObjects = sel_registerName("writeObjects:");
    selStringForType = sel_registerName("stringForType:");
    selNSStringWithUTF8String = sel_registerName("stringWithUTF8String:");
    selUTF8String = sel_registerName("UTF8String");
    clsNSPasteboard = objc_getClass("NSPasteboard");
    clsNSString = objc_getClass("NSString");
    clsNSArray = objc_getClass("NSArray");
    // NSPasteboardTypeString is @"public.utf8-plain-text"
    id str = ((id(*)(Class, SEL, const char*))objc_msgSend)(clsNSString, selNSStringWithUTF8String, "public.utf8-plain-text");
    typeString = str;
}

void macPaste() {
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateCombinedSessionState);
    if (!source) return;

    CGEventRef keyDown = CGEventCreateKeyboardEvent(source, (CGKeyCode)9, true);
    CGEventSetFlags(keyDown, kCGEventFlagMaskCommand);
    CGEventPost(kCGHIDEventTap, keyDown);
    CFRelease(keyDown);

    usleep(10000);

    CGEventRef keyUp = CGEventCreateKeyboardEvent(source, (CGKeyCode)9, false);
    CGEventSetFlags(keyUp, kCGEventFlagMaskCommand);
    CGEventPost(kCGHIDEventTap, keyUp);
    CFRelease(keyUp);

    CFRelease(source);
}

void macWriteClipboard(const char *text) {
    initPasteboard();
    // Get general pasteboard
    id pasteboard = ((id(*)(Class, SEL))objc_msgSend)(clsNSPasteboard, selGeneralPasteboard);
    // Clear contents
    ((void(*)(id, SEL))objc_msgSend)(pasteboard, selClearContents);
    // Create NSString
    id nsStr = ((id(*)(Class, SEL, const char*))objc_msgSend)(clsNSString, selNSStringWithUTF8String, text);
    // Create array with string
    id arr = ((id(*)(Class, SEL, id))objc_msgSend)(clsNSArray, sel_registerName("arrayWithObject:"), nsStr);
    // Write to pasteboard
    ((void(*)(id, SEL, id))objc_msgSend)(pasteboard, selWriteObjects, arr);
}

const char* macReadClipboard() {
    initPasteboard();
    // Get general pasteboard
    id pasteboard = ((id(*)(Class, SEL))objc_msgSend)(clsNSPasteboard, selGeneralPasteboard);
    // Read string
    id nsStr = ((id(*)(id, SEL, id))objc_msgSend)(pasteboard, selStringForType, typeString);
    if (!nsStr) return "";
    // Convert to C string
    const char *cStr = ((const char*(*)(id, SEL))objc_msgSend)(nsStr, selUTF8String);
    return cStr ? cStr : "";
}
*/
import "C"
import "unsafe"

func platformPaste() {
	C.macPaste()
}

func platformWriteClipboard(text string) {
	cText := C.CString(text)
	defer C.free(unsafe.Pointer(cText))
	C.macWriteClipboard(cText)
}

func platformReadClipboard() string {
	return C.GoString(C.macReadClipboard())
}
