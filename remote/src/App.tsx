import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import StatusBar from "./components/StatusBar";
import BottomNav from "./components/BottomNav";
import ConsolePage from "./pages/ConsolePage";
import SettingsPage from "./pages/SettingsPage";
import { ToastProvider } from "./hooks/useToast";

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <div className="flex flex-col h-screen bg-background">
          <StatusBar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/console" element={<ConsolePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/console" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </ToastProvider>
    </HashRouter>
  );
}
