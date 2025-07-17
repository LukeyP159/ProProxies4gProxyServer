import Header from "@/components/layout/header";
import ModemStatusTable from "@/components/modem-status-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const Modems = () => {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/modems'] });
  };

  const handleAddModem = () => {
    // TODO: Implement add modem dialog
    console.log('Add modem clicked');
  };

  return (
    <div>
      <Header
        title="Modems"
        subtitle="Manage and monitor your 4G modems"
        onRefresh={handleRefresh}
        onAddModem={handleAddModem}
      />
      
      <div className="p-6 space-y-6">
        <ModemStatusTable />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-surface shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Modem Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-3xl mb-2">📊</div>
                  <p className="text-sm text-gray-400">Modem health overview</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Signal Strength</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-3xl mb-2">📶</div>
                  <p className="text-sm text-gray-400">Signal strength monitoring</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Connection Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-3xl mb-2">🔗</div>
                  <p className="text-sm text-gray-400">Connection type distribution</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Modems;
