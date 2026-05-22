import { useState, useEffect, useRef } from "react";
import { Terminal, Trash2 } from "lucide-react";
import { GetLogs } from "../../wailsjs/go/main/App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";

interface LogEntry {
  time: string;
  type: string;
  content: string;
}

const logBadgeVariant: Record<string, "default" | "success" | "info" | "warning" | "destructive" | "secondary"> = {
  text: "success",
  enter: "info",
  undo: "warning",
  cursor: "secondary",
  delete: "destructive",
};

export default function LogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = () => {
      try {
        GetLogs().then((logData) => setLogs(logData as LogEntry[]));
      } catch {}
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">操作日志</h2>
          <Badge variant="secondary">{logs.length} 条</Badge>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-4">
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">实时日志</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{logs.length} 条记录</Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Terminal className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">暂无日志</p>
                    <p className="text-xs mt-1">手机端操作后将在此显示</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <span className="text-[11px] text-muted-foreground font-mono mt-0.5 shrink-0 w-16">
                        {log.time}
                      </span>
                      <Badge variant={logBadgeVariant[log.type] || "default"} className="shrink-0">
                        {log.type}
                      </Badge>
                      <span className="text-sm text-foreground/80 break-all">{log.content}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
