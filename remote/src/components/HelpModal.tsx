interface HelpModalProps {
  helpText?: string;
  onClose: () => void;
}

const DEFAULT_HELP = `## 按钮帮助
- **长按任意按钮** 可查看该按钮的详细说明

## 使用提示
- 确保手机和电脑在同一局域网
- 文本会通过剪贴板粘贴到电脑当前焦点
- 支持正则替换规则（在 hot-rule.txt 配置）`;

export default function HelpModal({ helpText, onClose }: HelpModalProps) {
  const content = helpText || DEFAULT_HELP;

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <h4 key={i}>{line.replace("## ", "")}</h4>;
      }
      if (line.startsWith("- ")) {
        const parts = line.replace("- ", "").split("**");
        return (
          <li key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <b key={j}>{part}</b> : part
            )}
          </li>
        );
      }
      return line ? <p key={i}>{line}</p> : null;
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>使用帮助</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {renderMarkdown(content)}
        </div>
      </div>
    </div>
  );
}
