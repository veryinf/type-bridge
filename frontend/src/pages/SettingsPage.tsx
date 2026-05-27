import { useState, useEffect } from "react";
import { Settings, Globe, Palette, Save, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { GetServerPort, GetMaxLogCount, SetMaxLogCount, SetServerPort, GetMinimizeToTray, SetMinimizeToTray } from "../../wailsjs/go/main/App";
import { useTheme } from "../hooks/useTheme";
import PageHeader from "../components/PageHeader";

export default function SettingsPage() {
  const [port, setPort] = useState("5000");
  const [maxLogCount, setMaxLogCount] = useState("100");
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    try {
      GetServerPort().then((p) => setPort(String(p)));
      GetMaxLogCount().then((count) => setMaxLogCount(String(count)));
      GetMinimizeToTray().then((v) => setMinimizeToTray(v));
    } catch {}
  }, []);

  const handleSave = async () => {
    try {
      await SetMaxLogCount(parseInt(maxLogCount) || 100);
      await SetMinimizeToTray(minimizeToTray);

      const newPort = parseInt(port) || 5000;
      if (newPort !== parseInt(String(await GetServerPort()))) {
        await SetServerPort(newPort);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("保存设置失败:", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader icon={Settings} title="设置" />

      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        <div className="flex justify-end">
          <Button variant={saved ? "secondary" : "default"} size="sm" className="gap-1.5" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" />
            {saved ? "已保存" : "保存设置"}
          </Button>
        </div>
        {/* Network Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">网络设置</CardTitle>
            </div>
            <CardDescription>配置 HTTP 服务器端口与连接状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium w-20 shrink-0">服务端口</label>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-32"
                min={1024}
                max={65535}
              />
              <span className="text-xs text-muted-foreground">默认 5000</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">HTTP 服务</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium">运行中</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">监听端口</p>
                <span className="text-sm font-mono font-medium">{port}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">显示设置</CardTitle>
            </div>
            <CardDescription>自定义界面外观</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium w-20 shrink-0">主题</label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  浅色
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  深色
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium w-20 shrink-0">关闭窗口</label>
              <div className="flex gap-2">
                <Button
                  variant={minimizeToTray ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinimizeToTray(true)}
                >
                  最小化到托盘
                </Button>
                <Button
                  variant={!minimizeToTray ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMinimizeToTray(false)}
                >
                  退出应用
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Log Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">日志设置</CardTitle>
            </div>
            <CardDescription>配置日志的存储数量</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium w-24 shrink-0">最大记录数</label>
              <Input
                type="number"
                value={maxLogCount}
                onChange={(e) => setMaxLogCount(e.target.value)}
                className="w-32"
              />
              <span className="text-xs text-muted-foreground">默认 100</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
