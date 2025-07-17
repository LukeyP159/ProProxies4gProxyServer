import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, RotateCcw, Settings, Power, Filter, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Modem } from "@shared/schema";

const ModemStatusTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: modems, isLoading } = useQuery<Modem[]>({
    queryKey: ['/api/modems'],
    refetchInterval: 10000,
  });

  const rotateMutation = useMutation({
    mutationFn: (modemId: number) => apiRequest('POST', `/api/modems/${modemId}/rotate`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "IP rotation initiated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modems'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to rotate IP address",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'reconnecting':
        return <Badge className="bg-yellow-100 text-yellow-800">Reconnecting</Badge>;
      case 'disconnected':
        return <Badge className="bg-red-100 text-red-800">Disconnected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getVpnStatus = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getSignalStrength = (strength: number) => {
    if (strength >= -70) return { width: '85%', color: 'bg-success' };
    if (strength >= -85) return { width: '60%', color: 'bg-warning' };
    return { width: '25%', color: 'bg-error' };
  };

  if (isLoading) {
    return (
      <Card className="bg-surface shadow">
        <CardHeader>
          <CardTitle>Modem Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">Modem Status</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandwidth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OpenVPN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modems?.map((modem) => {
                const signalProps = getSignalStrength(modem.signalStrength || -100);
                
                return (
                  <tr key={modem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Smartphone className="text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{modem.name}</div>
                          <div className="text-sm text-gray-500">IMEI: {modem.imei}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(modem.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{modem.localIp}</div>
                      <div className="text-sm text-gray-500">{modem.publicIp || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div className={`h-2 rounded-full ${signalProps.color}`} style={{ width: signalProps.width }}></div>
                        </div>
                        <span className="text-sm text-gray-600">{modem.signalStrength} dBm</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">↓ {modem.downloadSpeed} MB/s</div>
                      <div className="text-sm text-gray-500">↑ {modem.uploadSpeed} MB/s</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getVpnStatus(modem.status === 'connected' ? 'active' : 'inactive')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rotateMutation.mutate(modem.id)}
                          disabled={modem.status !== 'connected' || rotateMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModemStatusTable;
