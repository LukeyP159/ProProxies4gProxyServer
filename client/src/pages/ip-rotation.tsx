import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { IpRotationLog, Modem } from "@shared/schema";

const IpRotation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modems } = useQuery<Modem[]>({
    queryKey: ['/api/modems'],
    refetchInterval: 10000,
  });

  const { data: rotationLogs } = useQuery<IpRotationLog[]>({
    queryKey: ['/api/rotation-logs'],
    refetchInterval: 30000,
  });

  const rotateMutation = useMutation({
    mutationFn: (modemId: number) => apiRequest('POST', `/api/modems/${modemId}/rotate`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "IP rotation completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modems'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rotation-logs'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to rotate IP address",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/modems'] });
    queryClient.invalidateQueries({ queryKey: ['/api/rotation-logs'] });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getModemName = (modemId: number) => {
    return modems?.find(m => m.id === modemId)?.name || `Modem-${modemId}`;
  };

  return (
    <div>
      <Header
        title="IP Rotation"
        subtitle="Manage IP address rotation for your modems"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-surface shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Quick Rotation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modems?.filter(m => m.status === 'connected').map((modem) => (
                  <div key={modem.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{modem.name}</p>
                      <p className="text-sm text-gray-500">Current IP: {modem.publicIp}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => rotateMutation.mutate(modem.id)}
                      disabled={rotateMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Rotate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Rotation Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Scheduled rotation configuration</p>
                  <p className="text-xs text-gray-300 mt-1">Feature coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-surface shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Rotation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rotationLogs?.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getModemName(log.modemId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.oldIp || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.newIp || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.success ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(log.rotatedAt)}</div>
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

export default IpRotation;
