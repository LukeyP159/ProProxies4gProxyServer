import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RefreshCw, User, Shield, Network, Gauge, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProxyConfig {
  id: number;
  modemId: number;
  httpPort: number;
  socksPort: number;
  authentication: boolean;
  username: string;
  password: string;
  isActive: boolean;
  maxConnections: number;
  connectionTimeout: number;
  keepAlive: boolean;
  allowedIps: string[];
  blockedIps: string[];
  bandwidthLimit: number;
  dailyTrafficLimit: number;
  protocol: string;
  sslEnabled: boolean;
  logLevel: string;
  rotateOnDisconnect: boolean;
  customHeaders: string;
  modemName?: string;
}

interface ProxyConfigEditorProps {
  portNumber?: string;
}

export default function ProxyConfigEditor({ portNumber }: ProxyConfigEditorProps) {
  const [selectedConfig, setSelectedConfig] = useState<ProxyConfig | null>(null);
  const [formData, setFormData] = useState<Partial<ProxyConfig>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch proxy configurations
  const { data: configs, isLoading } = useQuery<ProxyConfig[]>({
    queryKey: ['/api/proxy-configs'],
    refetchInterval: 5000,
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (config: Partial<ProxyConfig>) => {
      return await apiRequest(`/api/proxy-configs/${selectedConfig?.id}`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "Proxy configuration updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/proxy-configs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update proxy configuration",
        variant: "destructive"
      });
    }
  });

  // Load configuration when configs are fetched
  useEffect(() => {
    if (configs && configs.length > 0) {
      // If portNumber is provided, find config by port
      if (portNumber) {
        const config = configs.find(c => 
          c.httpPort.toString() === portNumber || 
          c.socksPort.toString() === portNumber
        );
        if (config) {
          setSelectedConfig(config);
          setFormData(config);
        }
      } else {
        // Otherwise, select first config
        setSelectedConfig(configs[0]);
        setFormData(configs[0]);
      }
    }
  }, [configs, portNumber]);

  const handleSave = () => {
    if (!selectedConfig) return;
    updateConfigMutation.mutate(formData);
  };

  const handleConfigSelect = (configId: number) => {
    const config = configs?.find(c => c.id === configId);
    if (config) {
      setSelectedConfig(config);
      setFormData(config);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="p-6">Loading proxy configurations...</div>;
  }

  if (!configs || configs.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No proxy configurations found.</p>
        <p className="text-sm text-gray-400 mt-2">
          Configure proxy settings in the Modem Management section first.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Proxy Configuration Editor</h1>
          <p className="text-gray-600">Advanced proxy settings similar to port 51001 configuration</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSave}
            disabled={updateConfigMutation.isPending || !selectedConfig}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Proxy Ports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedConfig?.id === config.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleConfigSelect(config.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{config.modemName || `Modem ${config.modemId}`}</p>
                      <div className="flex space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          HTTP: {config.httpPort}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          SOCKS: {config.socksPort}
                        </Badge>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Editor */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {selectedConfig?.modemName || `Modem ${selectedConfig?.modemId}`} Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConfig && (
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="authentication">Authentication</TabsTrigger>
                  <TabsTrigger value="access-control">Access Control</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="httpPort">HTTP Port</Label>
                      <Input
                        id="httpPort"
                        type="number"
                        value={formData.httpPort || ''}
                        onChange={(e) => updateFormData('httpPort', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="socksPort">SOCKS5 Port</Label>
                      <Input
                        id="socksPort"
                        type="number"
                        value={formData.socksPort || ''}
                        onChange={(e) => updateFormData('socksPort', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="protocol">Protocol Support</Label>
                      <Select 
                        value={formData.protocol || 'both'} 
                        onValueChange={(value) => updateFormData('protocol', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select protocol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="both">HTTP + SOCKS5</SelectItem>
                          <SelectItem value="http">HTTP Only</SelectItem>
                          <SelectItem value="socks5">SOCKS5 Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="logLevel">Log Level</Label>
                      <Select 
                        value={formData.logLevel || 'info'} 
                        onValueChange={(value) => updateFormData('logLevel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive || false}
                        onCheckedChange={(checked) => updateFormData('isActive', checked)}
                      />
                      <Label htmlFor="isActive">Enable Proxy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sslEnabled"
                        checked={formData.sslEnabled || false}
                        onCheckedChange={(checked) => updateFormData('sslEnabled', checked)}
                      />
                      <Label htmlFor="sslEnabled">SSL/TLS Support</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="keepAlive"
                        checked={formData.keepAlive || false}
                        onCheckedChange={(checked) => updateFormData('keepAlive', checked)}
                      />
                      <Label htmlFor="keepAlive">Keep Alive Connections</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="authentication" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="w-4 h-4" />
                    <h3 className="text-lg font-semibold">Authentication Settings</h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="authentication"
                      checked={formData.authentication || false}
                      onCheckedChange={(checked) => updateFormData('authentication', checked)}
                    />
                    <Label htmlFor="authentication">Require Authentication</Label>
                  </div>

                  {formData.authentication && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={formData.username || ''}
                          onChange={(e) => updateFormData('username', e.target.value)}
                          placeholder="proxy username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password || ''}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          placeholder="proxy password"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="access-control" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="w-4 h-4" />
                    <h3 className="text-lg font-semibold">Access Control</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="allowedIps">Allowed IPs (comma-separated)</Label>
                      <Input
                        id="allowedIps"
                        value={formData.allowedIps?.join(', ') || ''}
                        onChange={(e) => updateFormData('allowedIps', e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip))}
                        placeholder="192.168.1.0/24, 10.0.0.0/8"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Leave empty to allow all IPs
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="blockedIps">Blocked IPs (comma-separated)</Label>
                      <Input
                        id="blockedIps"
                        value={formData.blockedIps?.join(', ') || ''}
                        onChange={(e) => updateFormData('blockedIps', e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip))}
                        placeholder="192.168.1.100, 10.0.0.50"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        These IPs will be denied access
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Gauge className="w-4 h-4" />
                    <h3 className="text-lg font-semibold">Performance Settings</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxConnections">Max Connections</Label>
                      <Input
                        id="maxConnections"
                        type="number"
                        value={formData.maxConnections || ''}
                        onChange={(e) => updateFormData('maxConnections', parseInt(e.target.value))}
                        placeholder="100"
                        min="1"
                        max="1000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="connectionTimeout">Connection Timeout (seconds)</Label>
                      <Input
                        id="connectionTimeout"
                        type="number"
                        value={formData.connectionTimeout || ''}
                        onChange={(e) => updateFormData('connectionTimeout', parseInt(e.target.value))}
                        placeholder="30"
                        min="1"
                        max="300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bandwidthLimit">Bandwidth Limit (KB/s)</Label>
                      <Input
                        id="bandwidthLimit"
                        type="number"
                        value={formData.bandwidthLimit || ''}
                        onChange={(e) => updateFormData('bandwidthLimit', parseInt(e.target.value))}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dailyTrafficLimit">Daily Traffic Limit (MB)</Label>
                      <Input
                        id="dailyTrafficLimit"
                        type="number"
                        value={formData.dailyTrafficLimit || ''}
                        onChange={(e) => updateFormData('dailyTrafficLimit', parseInt(e.target.value))}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Globe className="w-4 h-4" />
                    <h3 className="text-lg font-semibold">Advanced Settings</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customHeaders">Custom Headers (JSON)</Label>
                      <Input
                        id="customHeaders"
                        value={formData.customHeaders || ''}
                        onChange={(e) => updateFormData('customHeaders', e.target.value)}
                        placeholder='{"X-Forwarded-For": "original"}'
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="rotateOnDisconnect"
                        checked={formData.rotateOnDisconnect || false}
                        onCheckedChange={(checked) => updateFormData('rotateOnDisconnect', checked)}
                      />
                      <Label htmlFor="rotateOnDisconnect">Rotate IP on Disconnect</Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}