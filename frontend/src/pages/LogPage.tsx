import { useState, useEffect, useRef } from "react";
import { ScrollText } from "lucide-react";
import { GetLogs } from "../../wailsjs/go/main/App";
import PageHeader from "../components/PageHeader";

interface LogEntry {
  time: string;
  type: string;
  content: string;
}

const typeColors: Record<string, string> = {
  text: "text-green-400",
  key: "text-blue-400",
  combo: "text-purple-400",
  undo: "text-yellow-400",
  cursor: "text-cyan-400",
  delete: "text-red-400",
};

const typeLabels: Record<string, string> = {
  text: "TEXT",
  key: "KEY",
  combo: "COMBO",
  undo: "UNDO",
  cursor: "CURSOR",
  delete: "DEL",
};

export default function LogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

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
    if (autoScrollRef.current) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader icon={ScrollText} title="日志" />
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-[#0d1117] p-4 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-[#8b949e]">等待操作...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="leading-6">
              <span className="text-[#484f58]">[{log.time}]</span>
              <span className={`${typeColors[log.type] || "text-[#8b949e]"} mx-2`}>
                {typeLabels[log.type] || log.type.toUpperCase()}
              </span>
              <span className="text-[#e6edf3]">{log.content}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
