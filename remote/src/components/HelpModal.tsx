interface HelpModalProps {
  helpText?: string;
  onClose: () => void;
}

const DEFAULT_HELP = `## 基本操作
- **发送** - 将文本发送到电脑（应用替换规则）
- **回车** - 发送回车键
- **提交** - 发送文本 + 回车
- **清空** - 清空输入框

## 快捷操作
- **光标移动** - 控制电脑光标方向
- **删除** - 删除电脑上的字符
- **撤销** - 撤销上一次发送
- **上次** - 重新发送上一次内容

## 使用提示
- 确保手机和电脑在同一局域网
- 文本会通过剪贴板粘贴到电脑当前焦点
- 支持正则替换规则（在 hot-rule.txt 配置）`;

export default function HelpModal({ helpText, onClose }: HelpModalProps) {
  const content = helpText || DEFAULT_HELP;

  // 简单的 Markdown 渲染
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
