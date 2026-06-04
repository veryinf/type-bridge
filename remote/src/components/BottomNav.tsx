import { NavLink } from "react-router-dom";
import { Terminal, Settings } from "lucide-react";

const tabs: { to: string; label: string; icon: React.ReactNode }[] = [
  { to: "/console", label: "控制台", icon: <Terminal size={20} /> },
  { to: "/settings", label: "设置", icon: <Settings size={20} /> },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
