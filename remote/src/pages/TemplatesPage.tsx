import { useState, useEffect, useCallback } from "react";
import { useApi } from "../hooks/useApi";

interface Template {
  id: number;
  name: string;
  content: string;
  type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { sendText } = useApi();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/templates");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch (err) {
      setError("加载模板失败");
      console.error("加载模板失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSendTemplate = useCallback(
    async (template: Template) => {
      try {
        await sendText(template.content);
        // 显示发送成功提示
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = `已发送: ${template.name}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      } catch (err) {
        console.error("发送模板失败:", err);
      }
    },
    [sendText]
  );

  if (loading) {
    return (
      <div className="page templates-page">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page templates-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchTemplates} className="retry-btn">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page templates-page">
      <div className="page-header">
        <h2>快捷模板</h2>
        <p className="subtitle">点击即可快速发送</p>
      </div>

      {templates.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>暂无模板</p>
          <p className="empty-hint">请在桌面端添加模板</p>
        </div>
      ) : (
        <div className="template-list">
          {templates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handleSendTemplate(template)}
            >
              <div className="template-header">
                <span className="template-icon">
                  {template.type === "shortcut" ? "⌨️" : "📝"}
                </span>
                <span className="template-name">{template.name}</span>
              </div>
              <div className="template-content">{template.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
