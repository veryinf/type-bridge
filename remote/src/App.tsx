import { useState } from "react";
import StatusBar from "./components/StatusBar";
import BottomNav from "./components/BottomNav";
import ConsolePage from "./pages/ConsolePage";
import SettingsPage from "./pages/SettingsPage";
import { ToastProvider } from "./hooks/useToast";

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
    <ToastProvider>
      <div className="flex flex-col h-screen bg-background">
        <StatusBar />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </ToastProvider>
  );
}
