import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, Plus, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VpnConnection, Modem } from "@shared/schema";

const OpenVPN = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vpnConnections } = useQuery<VpnConnection[]>({
    queryKey: ['/api/vpn/connections'],
    refetchInterval: 10000,
  });

  const { data: modems } = useQuery<Modem[]>({
    queryKey: ['/api/modems'],
  });

  const generateConfigMutation = useMutation({
    mutationFn: (data: { modemId: number; clientName: string }) =>
      apiRequest('POST', '/api/vpn/generate', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "OpenVPN configuration generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vpn/connections'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate OpenVPN configuration",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/vpn/connections'] });
  };

  const handleGenerateConfig = () => {
    const modemId = modems?.find(m => m.status === 'connected')?.id;
    if (modemId) {
      const clientName = `vpn-client-${Date.now()}`;
      generateConfigMutation.mutate({ modemId, clientName });
    } else {
      toast({
        title: "Error",
        description: "No connected modems available",
        variant: "destructive",
      });
    }
  };

  const getModemName = (modemId: number) => {
    return modems?.find(m => m.id === modemId)?.name || `Modem-${modemId}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatDate = (date: Date | null) => {
    return date ? new Date(date).toLocaleString() : '-';
  };

  return (
    <div>
      <Header
        title="OpenVPN"
        subtitle="Manage OpenVPN configurations and connections"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-surface shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Active Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">
                  {vpnConnections?.filter(c => c.status === 'active').length || 0}
                </div>
                <p className="text-sm text-gray-500">Currently active</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Total Configs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">
                  {vpnConnections?.length || 0}
                </div>
                <p className="text-sm text-gray-500">Generated configs</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  onClick={handleGenerateConfig}
                  disabled={generateConfigMutation.isPending}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Config
                </Button>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Server Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-surface shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">VPN Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connected</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Config Path</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vpnConnections?.map((connection) => (
                    <tr key={connection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">
                            {connection.clientName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getModemName(connection.modemId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(connection.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(connection.connectedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-mono">
                          {connection.configPath}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpenVPN;
