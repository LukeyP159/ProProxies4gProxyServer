import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WebSocketProvider } from "@/lib/websocket";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Modems from "@/pages/modems";
import ModemManagement from "@/pages/modem-management";
import ProxyStatus from "@/pages/3proxy-status";
import ProxyConfigEditor from "@/pages/proxy-config-editor";
import IpRotation from "@/pages/ip-rotation";
import OpenVPN from "@/pages/openvpn";
import Configuration from "@/pages/configuration";
import Api from "@/pages/api";
import Analytics from "@/pages/analytics";
import Logs from "@/pages/logs";
import ProxyDashboard from "@/pages/proxy-dashboard";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/modems" component={Modems} />
          <Route path="/modem-management" component={ModemManagement} />
          <Route path="/3proxy-status" component={ProxyStatus} />
          <Route path="/proxy-config-editor" component={() => <ProxyConfigEditor />} />
          <Route path="/ip-rotation" component={IpRotation} />
          <Route path="/openvpn" component={OpenVPN} />
          <Route path="/configuration" component={Configuration} />
          <Route path="/api" component={Api} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/logs" component={Logs} />
          <Route path="/proxy-dashboard" component={ProxyDashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
