import { useState, useEffect } from "react";

interface Settings {
  autoConnect: boolean;
  showNotifications: boolean;
  hapticFeedback: boolean;
}

const defaultSettings: Settings = {
  autoConnect: true,
  showNotifications: true,
  hapticFeedback: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [version, setVersion] = useState("DEV");

  useEffect(() => {
    const saved = localStorage.getItem("typebridge-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("加载设置失败:", e);
      }
    }

    fetch("/api/v1/version")
      .then((res) => res.json())
      .then((data) => { if (data.version) setVersion(data.version); })
      .catch(() => {});
  }, []);

  const handleToggle = (key: keyof Settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem("typebridge-settings", JSON.stringify(newSettings));
  };

  const handleClearData = () => {
    if (confirm("确定要清除所有本地数据吗？")) {
      localStorage.clear();
      setSettings(defaultSettings);
    }
  };

  return (
    <div className="page settings-page">
      <div className="settings-group">
        <h3 className="group-title">通用</h3>
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">自动连接</span>
            <span className="setting-desc">启动时自动连接到服务器</span>
          </div>
          <button
            className={`toggle ${settings.autoConnect ? "active" : ""}`}
            onClick={() => handleToggle("autoConnect")}
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">显示通知</span>
            <span className="setting-desc">操作成功时显示提示</span>
          </div>
          <button
            className={`toggle ${settings.showNotifications ? "active" : ""}`}
            onClick={() => handleToggle("showNotifications")}
          >
            <span className="toggle-thumb" />
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">触觉反馈</span>
            <span className="setting-desc">点击按钮时震动反馈</span>
          </div>
          <button
            className={`toggle ${settings.hapticFeedback ? "active" : ""}`}
            onClick={() => handleToggle("hapticFeedback")}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      <div className="settings-group">
        <h3 className="group-title">数据</h3>
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">清除本地数据</span>
            <span className="setting-desc">清除所有本地存储的设置</span>
          </div>
          <button className="danger-btn" onClick={handleClearData}>
            清除
          </button>
        </div>
      </div>

      <div className="settings-group">
        <h3 className="group-title">关于</h3>
        <div className="about-info">
          <p className="app-name">Type Bridge</p>
          <p className="app-version">版本 {version}</p>
          <p className="app-desc">手机电脑输入同步工具</p>
          <a
            href="https://github.com/veryinf/type-bridge"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            GitHub 仓库
          </a>
        </div>
      </div>
    </div>
  );
}
