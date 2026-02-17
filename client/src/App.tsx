import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import CaseSetup from "./pages/CaseSetup";
import EventLogWindow from "./pages/EventLogWindow";
import EventLogPopout from "./pages/EventLogPopout";
import CockpitPage from "./pages/CockpitPage";
import MobileLogin from "./pages/mobile/MobileLogin";
import MobileViewer from "./pages/mobile/MobileViewer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/setup" component={CaseSetup} />
      <Route path="/analysis" component={Home} />
      <Route path="/log-window" component={EventLogWindow} />
      <Route path="/popout/event-log" component={EventLogPopout} />
      <Route path="/cockpit" component={CockpitPage} />
      <Route path="/mobile/login" component={MobileLogin} />
      <Route path="/mobile/viewer" component={MobileViewer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <PreferencesProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
