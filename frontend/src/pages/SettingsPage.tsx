import { useState, useEffect } from "react";
import { Settings, Globe, MonitorSmartphone, Palette, Save, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { GetServerPort, GetConsoleConfig, SaveConsoleConfig } from "../../wailsjs/go/main/App";
import { useTheme } from "../hooks/useTheme";

export default function SettingsPage() {
  const [port, setPort] = useState("5000");
  const [maxLogCount, setMaxLogCount] = useState("100");
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    try {
      GetServerPort().then((p) => setPort(String(p)));
      GetConsoleConfig().then((config) => {
        if (config.maxLogCount) {
          setMaxLogCount(String(config.maxLogCount));
        }
      });
    } catch {}
  }, []);

  const handleSave = async () => {
    try {
      const config = await GetConsoleConfig();
      config.maxLogCount = parseInt(maxLogCount) || 100;
      await SaveConsoleConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">设置</h2>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleSave}>
          {saved ? (
            <Badge variant="success" className="text-xs">已保存</Badge>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              保存设置
            </>
          )}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Network Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">网络设置</CardTitle>
            </div>
            <CardDescription>配置 HTTP 服务器端口</CardDescription>
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
              <span className="text-xs text-muted-foreground">默认 5000，修改后需重启应用</span>
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
          </CardContent>
        </Card>

        {/* Log Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">日志设置</CardTitle>
            </div>
            <CardDescription>配置操作日志的存储数量</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium w-24 shrink-0">最大记录数</label>
              <Input
                type="number"
                value={maxLogCount}
                onChange={(e) => setMaxLogCount(e.target.value)}
                className="w-32"
                min={10}
                max={1000}
              />
              <span className="text-xs text-muted-foreground">范围 10-1000，默认 100</span>
            </div>
          </CardContent>
        </Card>

        {/* Connection Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">连接信息</CardTitle>
            </div>
            <CardDescription>当前连接状态</CardDescription>
          </CardHeader>
          <CardContent>
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
      </div>
    </div>
  );
}
