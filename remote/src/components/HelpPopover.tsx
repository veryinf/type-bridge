interface HelpPopoverProps {
  text: string;
  onClose: () => void;
}

export default function HelpPopover({ text, onClose }: HelpPopoverProps) {
  return (
    <div className="help-popover-overlay" onClick={onClose} onTouchEnd={onClose}>
      <div className="help-popover" onClick={(e) => e.stopPropagation()}>
        <div className="help-popover-text">{text}</div>
      </div>
    </div>
  );
}
