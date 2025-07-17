import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, RotateCcw, Activity, Settings, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProxyStatus {
  running: boolean;
  pid?: string;
  configFile: string;
  logFile: string;
}

export default function ProxyStatusPage() {
  const [logs, setLogs] = useState('');
  const [logLines, setLogLines] = useState(100);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch proxy status
  const { data: status, isLoading: statusLoading } = useQuery<ProxyStatus>({
    queryKey: ['/api/proxy/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/proxy/logs', logLines],
    queryFn: async () => {
      const response = await fetch(`/api/proxy/logs?lines=${logLines}`);
      return response.json();
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  useEffect(() => {
    if (logsData?.logs) {
      setLogs(logsData.logs);
    }
  }, [logsData]);

  // Start proxy
  const startMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/proxy/start', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "3proxy Started",
        description: "Proxy service started successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proxy/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Start Failed",
        description: error.message || "Failed to start 3proxy",
        variant: "destructive"
      });
    }
  });

  // Stop proxy
  const stopMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/proxy/stop', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "3proxy Stopped",
        description: "Proxy service stopped successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proxy/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Stop Failed",
        description: error.message || "Failed to stop 3proxy",
        variant: "destructive"
      });
    }
  });

  // Restart proxy
  const restartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/proxy/restart', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "3proxy Restarted",
        description: "Proxy service restarted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proxy/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Restart Failed",
        description: error.message || "Failed to restart 3proxy",
        variant: "destructive"
      });
    }
  });

  if (statusLoading) {
    return <div className="p-6">Loading proxy status...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">3proxy Status</h1>
          <p className="text-gray-600">Monitor and manage the 3proxy service</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending || status?.running}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
          <Button
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending || !status?.running}
            variant="destructive"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
          <Button
            onClick={() => restartMutation.mutate()}
            disabled={restartMutation.isPending}
            variant="outline"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={status?.running ? "default" : "secondary"}>
                {status?.running ? 'RUNNING' : 'STOPPED'}
              </Badge>
              {status?.running && status?.pid && (
                <span className="text-sm text-gray-600">PID: {status.pid}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>Config: {status?.configFile}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Log File</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>Logs: {status?.logFile}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">Live Logs</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Lines to show:</label>
            <select
              value={logLines}
              onChange={(e) => setLogLines(parseInt(e.target.value))}
              className="px-3 py-1 border rounded-md"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>3proxy Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
                {logsLoading ? (
                  <div>Loading logs...</div>
                ) : logs ? (
                  <pre className="whitespace-pre-wrap">{logs}</pre>
                ) : (
                  <div className="text-gray-500">No logs available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Configuration file: <code>{status?.configFile}</code>
                </p>
                <p className="text-sm text-gray-600">
                  The 3proxy configuration is automatically generated based on your modem and proxy settings.
                  To modify the configuration, update the proxy settings in the Modem Management section.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}