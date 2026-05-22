import { Route, Switch } from "wouter";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import LogPage from "./pages/LogPage";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";

function App() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/logs" component={LogPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/about" component={AboutPage} />
          <Route>
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>页面未找到</p>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

export default App;
