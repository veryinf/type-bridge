import { useState, useEffect } from "react";

interface StatusBarProps {
  version?: string;
}

export default function StatusBar({ version = "0.0.6" }: StatusBarProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 检测网络状态
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const timeStr = currentTime.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="status-bar">
      <div className="status-left">
        <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
        <span className="status-text">
          {isOnline ? "已连接" : "未连接"}
        </span>
      </div>
      <div className="status-center">
        <span className="app-title">Type Bridge</span>
      </div>
      <div className="status-right">
        <span className="version">v{version}</span>
        <span className="time">{timeStr}</span>
      </div>
    </header>
  );
}
