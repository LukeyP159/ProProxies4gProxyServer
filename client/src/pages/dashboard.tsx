import Header from "@/components/layout/header";
import StatsGrid from "@/components/stats-grid";
import ModemStatusTable from "@/components/modem-status-table";
import RecentLogs from "@/components/recent-logs";
import ApiEndpoints from "@/components/api-endpoints";
import { useQueryClient } from "@tanstack/react-query";

const Dashboard = () => {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/modems'] });
    queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
  };

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Monitor and manage your 4G proxy infrastructure"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 space-y-6">
        <StatsGrid />
        <ModemStatusTable />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Bandwidth Usage</h3>
              <p className="text-sm text-gray-500">Last 24 hours</p>
            </div>
            <div className="p-6">
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-3xl mb-2">📊</div>
                  <p className="text-sm text-gray-400">Real-time bandwidth monitoring chart</p>
                  <p className="text-xs text-gray-300 mt-1">Chart implementation pending</p>
                </div>
              </div>
            </div>
          </div>
          
          <ApiEndpoints />
        </div>
        
        <RecentLogs />
      </div>
    </div>
  );
};

export default Dashboard;
