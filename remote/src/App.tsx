import { useState, useEffect } from "react";
import StatusBar from "./components/StatusBar";
import BottomNav from "./components/BottomNav";
import ConsolePage from "./pages/ConsolePage";
import TemplatesPage from "./pages/TemplatesPage";
import SettingsPage from "./pages/SettingsPage";
import HelpModal from "./components/HelpModal";
import { useApi } from "./hooks/useApi";

type Tab = "console" | "templates" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("console");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpText, setHelpText] = useState<string | undefined>();
  const { getDefaultLayout } = useApi();

  useEffect(() => {
    getDefaultLayout().then((l) => {
      if (l) setHelpText(l.help_text);
    });
  }, [getDefaultLayout]);

  const renderPage = () => {
    switch (activeTab) {
      case "console":
        return <ConsolePage />;
      case "templates":
        return <TemplatesPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <ConsolePage />;
    }
  };

  return (
    <div className="app-container">
      <StatusBar onHelp={() => setIsHelpOpen(true)} />
      <main className="main-content">
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      {isHelpOpen && <HelpModal helpText={helpText} onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
}
