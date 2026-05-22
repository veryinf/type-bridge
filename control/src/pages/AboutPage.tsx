import { Info, ExternalLink, CheckCircle, Keyboard, MousePointer, CornerDownLeft, Undo2, Type } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { GetVersion } from "../../wailsjs/go/main/App";
import { useEffect, useState } from "react";

export default function AboutPage() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    try {
      GetVersion().then((v) => setVersion(v));
    } catch {
      setVersion("dev");
    }
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center gap-2 px-6 py-3 border-b border-border bg-card/50 backdrop-blur">
        <Info className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">关于</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* App Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">EasyInput</CardTitle>
                <CardDescription>手机电脑输入同步工具</CardDescription>
              </div>
              <Badge variant="info" className="text-sm">v{version}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              EasyInput 让你通过手机浏览器远程控制电脑输入。
              连接同一 WiFi 后，手机扫描二维码即可访问控制页面，
              实现文本发送、回车、撤销、光标移动等操作。
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">核心功能</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Keyboard, title: "文本发送", desc: "手机输入同步到电脑" },
                { icon: CornerDownLeft, title: "回车控制", desc: "远程发送回车键" },
                { icon: Undo2, title: "撤销操作", desc: "撤销上一步操作" },
                { icon: MousePointer, title: "光标控制", desc: "上下左右移动光标" },
                { icon: Type, title: "正则替换", desc: "自定义文本替换规则" },
                { icon: CheckCircle, title: "符号包裹", desc: "快速输入符号配对" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                  <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">相关链接</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="https://github.com/veryinf/easy-input"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">GitHub 仓库</p>
                <p className="text-xs text-muted-foreground">veryinf/easy-input</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
            <a
              href="https://github.com/veryinf/easy-input/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <CheckCircle className="h-4 w-4 text-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">检查更新</p>
                <p className="text-xs text-muted-foreground">查看最新版本</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">技术栈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Wails v2", "Go 1.24", "React 18", "TypeScript", "Tailwind CSS", "shadcn/ui", "wouter", "robotgo"].map(
                (tech) => (
                  <Badge key={tech} variant="secondary">{tech}</Badge>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
