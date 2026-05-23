import { useState, useEffect, useCallback } from "react";

export interface HistoryEntry {
  text: string;
  timestamp: number;
}

const STORAGE_KEY = "typebridge_history";
const MAX_ENTRIES = 50;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export function saveToHistory(text: string) {
  const history = loadHistory();
  if (history.length > 0 && history[0].text === text) return;
  history.unshift({ text, timestamp: Date.now() });
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

function deleteHistoryEntry(index: number) {
  const history = loadHistory();
  history.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

interface HistoryModalProps {
  onSelect: (text: string) => void;
  onClose: () => void;
}

export default function HistoryModal({ onSelect, onClose }: HistoryModalProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const handleDelete = useCallback((index: number) => {
    deleteHistoryEntry(index);
    setEntries(loadHistory());
  }, []);

  const handleClear = useCallback(() => {
    clearHistory();
    setEntries([]);
  }, []);

  const handleSelect = useCallback(
    (text: string) => {
      onSelect(text);
      onClose();
    },
    [onSelect, onClose]
  );

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const time = d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) return time;

    return (
      d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) +
      " " +
      time
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content history-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>历史记录</h3>
          <div className="history-actions">
            {entries.length > 0 && (
              <button className="history-clear-btn" onClick={handleClear}>
                清空
              </button>
            )}
            <button className="modal-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        <div className="history-list">
          {entries.length === 0 ? (
            <div className="history-empty">暂无历史记录</div>
          ) : (
            entries.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} className="history-item">
                <div
                  className="history-item-content"
                  onClick={() => handleSelect(entry.text)}
                >
                  <span className="history-time">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span className="history-text">{entry.text}</span>
                </div>
                <button
                  className="history-delete-btn"
                  onClick={() => handleDelete(index)}
                  title="删除"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
