import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [version, setVersion] = useState("DEV");

  useEffect(() => {
    fetch("/api/v1/version")
      .then((res) => res.json())
      .then((data) => { if (data.version) setVersion(data.version); })
      .catch(() => {});
  }, []);

  const handleClearData = () => {
    if (confirm("确定要清除所有本地数据吗？")) {
      localStorage.clear();
    }
  };

  return (
    <div className="page settings-page">
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
