type Tab = "console" | "settings";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "console", label: "控制台", icon: "⌨️" },
  { key: "settings", label: "设置", icon: "⚙️" },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          className={`nav-item ${activeTab === key ? "active" : ""}`}
          onClick={() => onTabChange(key)}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
