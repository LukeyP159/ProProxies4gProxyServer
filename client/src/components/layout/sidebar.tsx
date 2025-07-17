import { Link, useLocation } from "wouter";
import { Signal, Gauge, Smartphone, RotateCcw, Shield, Settings, Code, ChartLine, FileText, Circle, Monitor, Network, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardStats, SystemStatus } from "@/types";

const Sidebar = () => {
  const [location] = useLocation();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000,
  });

  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ['/api/system/status'],
    refetchInterval: 5000,
  });

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Gauge },
    { name: 'Modems', href: '/modems', icon: Smartphone, badge: stats?.activeModems },
    { name: 'Modem Management', href: '/modem-management', icon: Wrench },
    { name: 'Proxy Config Editor', href: '/proxy-config-editor', icon: Settings },
    { name: '3proxy Status', href: '/3proxy-status', icon: Network },
    { name: 'IP Rotation', href: '/ip-rotation', icon: RotateCcw },
    { name: 'OpenVPN', href: '/openvpn', icon: Shield },
    { name: 'Configuration', href: '/configuration', icon: Settings },
    { name: 'API', href: '/api', icon: Code },
    { name: 'Analytics', href: '/analytics', icon: ChartLine },
    { name: 'Logs', href: '/logs', icon: FileText },
    { name: 'Proxy Dashboard', href: '/proxy-dashboard', icon: Monitor },
  ];

  return (
    <aside className="w-64 bg-surface shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Signal className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">4G Proxy Server</h1>
            <p className="text-sm text-gray-500">v2.1.0</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-6 py-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</h3>
        </div>
        
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={`flex items-center px-6 py-3 ${
                isActive 
                  ? 'text-gray-700 bg-blue-50 border-r-2 border-primary' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
                <Icon className="mr-3 h-5 w-5" />
                <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-success text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">System Status</span>
            <Circle className="w-2 h-2 text-success fill-current" />
          </div>
          <div className="text-xs text-gray-500">
            <div>CPU: {systemStatus?.cpu || '23%'}</div>
            <div>Memory: {systemStatus?.memory || '1.2GB'}</div>
            <div>Uptime: {systemStatus?.uptime || '7d 12h'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
