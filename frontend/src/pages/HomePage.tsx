import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, ExternalLink, Minus, Terminal, Keyboard, CornerDownLeft, Undo2, MousePointer } from "lucide-react";
import { GetAccessURL, GetLanIP, GetVersion } from "../../wailsjs/go/main/App";
import { WindowHide } from "../../wailsjs/runtime/runtime";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function HomePage() {
  const [accessURL, setAccessURL] = useState("");
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isDev = import.meta.env.DEV;

    if (isDev) {
      GetLanIP()
        .then((ip) => {
          setAccessURL(`http://${ip}:3020`);
        })
        .catch(() => {
          setAccessURL("http://localhost:3020");
        })
        .finally(() => setLoading(false));
    } else {
      GetAccessURL()
        .then((url) => setAccessURL(url))
        .catch(() => setAccessURL("http://localhost:5000/mobile.html"))
        .finally(() => setLoading(false));
    }

    GetVersion()
      .then((v) => setVersion(v))
      .catch(() => setVersion("dev"));
  }, []);

  const copyToClipboard = () => navigator.clipboard.writeText(accessURL);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">主页</h2>
          <Badge variant="success">v{version}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { try { WindowHide(); } catch {} }} title="最小化到托盘">
          <Minus className="h-4 w-4" />
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto space-y-5">
          {/* QR Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">扫码连接</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-xl p-3 shadow-inner">
                {!loading && <QRCodeSVG value={accessURL} size={160} level="M" includeMargin={false} bgColor="white" fgColor="#1e293b" />}
              </div>
              <div className="w-full bg-muted/50 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground mb-1">访问地址</p>
                <p className="text-sm font-mono font-semibold text-primary break-all">{loading ? "加载中..." : accessURL}</p>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={copyToClipboard} disabled={loading}>
                  <Copy className="h-3.5 w-3.5" />
                  复制地址
                </Button>
                <a href={accessURL} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    打开网页
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">功能特性</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Keyboard, label: "文本发送" },
                  { icon: CornerDownLeft, label: "回车控制" },
                  { icon: Undo2, label: "撤销操作" },
                  { icon: MousePointer, label: "光标控制" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">使用说明</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>确保手机和电脑在同一 WiFi 网络下</li>
                <li>手机扫描上方二维码或访问显示的地址</li>
                <li>在手机输入文字，点击发送即可同步到电脑</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
