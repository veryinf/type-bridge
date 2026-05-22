import { useState } from "react";
import StatusBar from "./components/StatusBar";
import BottomNav from "./components/BottomNav";
import ConsolePage from "./pages/ConsolePage";
import SettingsPage from "./pages/SettingsPage";

type Tab = "console" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("console");

  const renderPage = () => {
    switch (activeTab) {
      case "console":
        return <ConsolePage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <ConsolePage />;
    }
  };

  return (
    <div className="app-container">
      <StatusBar />
      <main className="main-content">
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
