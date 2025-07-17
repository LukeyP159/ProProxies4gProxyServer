import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings, Download, Power, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Modem {
  id: number;
  name: string;
  imei: string;
  localIp: string;
  publicIp: string;
  status: string;
  signalStrength: number;
  provider: string;
  apnName?: string;
  apnUsername?: string;
  apnPassword?: string;
  autoIpRotation: boolean;
  ipRotationInterval: number;
  portsAssigned: boolean;
  openvpnConfigUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProxyConfig {
  id: number;
  modemId: number;
  httpPort: number;
  socksPort: number;
  authentication: boolean;
  username?: string;
  password?: string;
  isActive: boolean;
}

export default function ModemManagement() {
  const [showStage1Dialog, setShowStage1Dialog] = useState(false);
  const [showStage2Dialog, setShowStage2Dialog] = useState(false);
  const [selectedModem, setSelectedModem] = useState<Modem | null>(null);
  const [stage1Form, setStage1Form] = useState({
    name: '',
    imei: '',
    apnName: '',
    apnUsername: '',
    apnPassword: '',
    autoIpRotation: false,
    ipRotationInterval: 30
  });
  const [stage2Form, setStage2Form] = useState({
    httpPort: '',
    socksPort: '',
    authentication: false,
    username: '',
    password: '',
    maxConnections: 100,
    connectionTimeout: 30,
    keepAlive: true,
    allowedIps: '',
    blockedIps: '',
    bandwidthLimit: '',
    dailyTrafficLimit: '',
    protocol: 'both',
    sslEnabled: false,
    logLevel: 'info',
    rotateOnDisconnect: false,
    customHeaders: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch modems
  const { data: modems = [], isLoading: modemsLoading } = useQuery({
    queryKey: ['/api/modems'],
  });

  // Fetch proxy configurations
  const { data: proxyConfigs = [] } = useQuery({
    queryKey: ['/api/proxy-configs'],
  });

  // Stage 1: Register modem
  const registerModemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/modems', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Modem Registered",
        description: "Modem has been successfully registered in the database",
      });
      setShowStage1Dialog(false);
      setStage1Form({
        name: '',
        imei: '',
        apnName: '',
        apnUsername: '',
        apnPassword: '',
        autoIpRotation: false,
        ipRotationInterval: 30
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modems'] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register modem",
        variant: "destructive"
      });
    }
  });

  // Stage 2: Assign ports
  const assignPortsMutation = useMutation({
    mutationFn: async ({ modemId, ...data }: any) => {
      return await apiRequest(`/api/modems/${modemId}/assign-ports`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Ports Assigned",
        description: `HTTP and SOCKS ports assigned. OpenVPN config is ready for download.`,
      });
      setShowStage2Dialog(false);
      setStage2Form({
        httpPort: '',
        socksPort: '',
        authentication: false,
        username: '',
        password: '',
        maxConnections: 100,
        connectionTimeout: 30,
        keepAlive: true,
        allowedIps: '',
        blockedIps: '',
        bandwidthLimit: '',
        dailyTrafficLimit: '',
        protocol: 'both',
        sslEnabled: false,
        logLevel: 'info',
        rotateOnDisconnect: false,
        customHeaders: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/modems'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proxy-configs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Port Assignment Failed",
        description: error.message || "Failed to assign ports",
        variant: "destructive"
      });
    }
  });

  // IP rotation
  const rotateIpMutation = useMutation({
    mutationFn: async (modemId: number) => {
      return await apiRequest(`/api/modems/${modemId}/rotate-ip`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "IP Rotation Started",
        description: "Modem is rotating IP address",
      });
    }
  });

  // Reboot modem
  const rebootMutation = useMutation({
    mutationFn: async (modemId: number) => {
      return await apiRequest(`/api/modems/${modemId}/reboot`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Modem Rebooting",
        description: "Modem reboot initiated",
      });
    }
  });

  const getProxyConfigsForModem = (modemId: number) => {
    return proxyConfigs.filter((config: ProxyConfig) => config.modemId === modemId && config.isActive);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected': return '#d4edda';
      case 'disconnected': return '#f8d7da';
      case 'reconnecting': return '#fff3cd';
      case 'error': return '#f8d7da';
      case 'rebooting': return '#e2e3e5';
      default: return '#f8f9fa';
    }
  };

  const handleStage1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    registerModemMutation.mutate(stage1Form);
  };

  const handleStage2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModem) return;
    
    assignPortsMutation.mutate({
      modemId: selectedModem.id,
      ...stage2Form,
      httpPort: parseInt(stage2Form.httpPort),
      socksPort: parseInt(stage2Form.socksPort),
      allowedIps: stage2Form.allowedIps.split(',').map(ip => ip.trim()).filter(ip => ip),
      blockedIps: stage2Form.blockedIps.split(',').map(ip => ip.trim()).filter(ip => ip),
      bandwidthLimit: stage2Form.bandwidthLimit ? parseInt(stage2Form.bandwidthLimit) : null,
      dailyTrafficLimit: stage2Form.dailyTrafficLimit ? parseInt(stage2Form.dailyTrafficLimit) : null,
    });
  };

  const openStage2Dialog = (modem: Modem) => {
    setSelectedModem(modem);
    setShowStage2Dialog(true);
  };

  const downloadOpenVPNConfig = (modem: Modem) => {
    if (modem.openvpnConfigUrl) {
      window.open(modem.openvpnConfigUrl, '_blank');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Modem Management</h1>
          <p className="text-gray-600">Two-stage modem setup: Registration → Port Assignment</p>
        </div>
        <Dialog open={showStage1Dialog} onOpenChange={setShowStage1Dialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Stage 1: Register Modem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stage 1: Register Modem in Database</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStage1Submit} className="space-y-4">
              <div>
                <Label htmlFor="name">Modem Name</Label>
                <Input
                  id="name"
                  value={stage1Form.name}
                  onChange={(e) => setStage1Form({...stage1Form, name: e.target.value})}
                  placeholder="e.g., M300z-001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="imei">IMEI</Label>
                <Input
                  id="imei"
                  value={stage1Form.imei}
                  onChange={(e) => setStage1Form({...stage1Form, imei: e.target.value})}
                  placeholder="e.g., 356938035643809"
                  required
                />
              </div>
              <div>
                <Label htmlFor="apnName">APN Name (Optional)</Label>
                <Input
                  id="apnName"
                  value={stage1Form.apnName}
                  onChange={(e) => setStage1Form({...stage1Form, apnName: e.target.value})}
                  placeholder="e.g., internet"
                />
              </div>
              <div>
                <Label htmlFor="apnUsername">APN Username (Optional)</Label>
                <Input
                  id="apnUsername"
                  value={stage1Form.apnUsername}
                  onChange={(e) => setStage1Form({...stage1Form, apnUsername: e.target.value})}
                  placeholder="APN username"
                />
              </div>
              <div>
                <Label htmlFor="apnPassword">APN Password (Optional)</Label>
                <Input
                  id="apnPassword"
                  type="password"
                  value={stage1Form.apnPassword}
                  onChange={(e) => setStage1Form({...stage1Form, apnPassword: e.target.value})}
                  placeholder="APN password"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoIpRotation"
                  checked={stage1Form.autoIpRotation}
                  onCheckedChange={(checked) => setStage1Form({...stage1Form, autoIpRotation: checked})}
                />
                <Label htmlFor="autoIpRotation">Enable Auto IP Rotation</Label>
              </div>
              {stage1Form.autoIpRotation && (
                <div>
                  <Label htmlFor="ipRotationInterval">IP Rotation Interval (minutes)</Label>
                  <Input
                    id="ipRotationInterval"
                    type="number"
                    value={stage1Form.ipRotationInterval}
                    onChange={(e) => setStage1Form({...stage1Form, ipRotationInterval: parseInt(e.target.value)})}
                    min="1"
                    max="1440"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowStage1Dialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={registerModemMutation.isPending}>
                  {registerModemMutation.isPending ? 'Registering...' : 'Register Modem'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stage 2 Dialog */}
      <Dialog open={showStage2Dialog} onOpenChange={setShowStage2Dialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stage 2: Assign Ports to {selectedModem?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStage2Submit} className="space-y-4">
            <div>
              <Label htmlFor="httpPort">HTTP Port</Label>
              <Input
                id="httpPort"
                type="number"
                value={stage2Form.httpPort}
                onChange={(e) => setStage2Form({...stage2Form, httpPort: e.target.value})}
                placeholder="e.g., 51001"
                required
              />
            </div>
            <div>
              <Label htmlFor="socksPort">SOCKS5 Port</Label>
              <Input
                id="socksPort"
                type="number"
                value={stage2Form.socksPort}
                onChange={(e) => setStage2Form({...stage2Form, socksPort: e.target.value})}
                placeholder="e.g., 51002"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="authentication"
                checked={stage2Form.authentication}
                onCheckedChange={(checked) => setStage2Form({...stage2Form, authentication: checked})}
              />
              <Label htmlFor="authentication">Enable Authentication</Label>
            </div>
            {stage2Form.authentication && (
              <>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={stage2Form.username}
                    onChange={(e) => setStage2Form({...stage2Form, username: e.target.value})}
                    placeholder="proxy username"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={stage2Form.password}
                    onChange={(e) => setStage2Form({...stage2Form, password: e.target.value})}
                    placeholder="proxy password"
                  />
                </div>
              </>
            )}
            
            {/* Advanced Configuration Section */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Advanced Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxConnections">Max Connections</Label>
                  <Input
                    id="maxConnections"
                    type="number"
                    value={stage2Form.maxConnections}
                    onChange={(e) => setStage2Form({...stage2Form, maxConnections: parseInt(e.target.value)})}
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
                    value={stage2Form.connectionTimeout}
                    onChange={(e) => setStage2Form({...stage2Form, connectionTimeout: parseInt(e.target.value)})}
                    placeholder="30"
                    min="1"
                    max="300"
                  />
                </div>
                <div>
                  <Label htmlFor="protocol">Protocol Support</Label>
                  <Select value={stage2Form.protocol} onValueChange={(value) => setStage2Form({...stage2Form, protocol: value})}>
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
                  <Select value={stage2Form.logLevel} onValueChange={(value) => setStage2Form({...stage2Form, logLevel: value})}>
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
                <div>
                  <Label htmlFor="bandwidthLimit">Bandwidth Limit (KB/s)</Label>
                  <Input
                    id="bandwidthLimit"
                    type="number"
                    value={stage2Form.bandwidthLimit}
                    onChange={(e) => setStage2Form({...stage2Form, bandwidthLimit: e.target.value})}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="dailyTrafficLimit">Daily Traffic Limit (MB)</Label>
                  <Input
                    id="dailyTrafficLimit"
                    type="number"
                    value={stage2Form.dailyTrafficLimit}
                    onChange={(e) => setStage2Form({...stage2Form, dailyTrafficLimit: e.target.value})}
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="allowedIps">Allowed IPs (comma-separated)</Label>
                  <Input
                    id="allowedIps"
                    value={stage2Form.allowedIps}
                    onChange={(e) => setStage2Form({...stage2Form, allowedIps: e.target.value})}
                    placeholder="192.168.1.0/24, 10.0.0.0/8"
                  />
                </div>
                <div>
                  <Label htmlFor="blockedIps">Blocked IPs (comma-separated)</Label>
                  <Input
                    id="blockedIps"
                    value={stage2Form.blockedIps}
                    onChange={(e) => setStage2Form({...stage2Form, blockedIps: e.target.value})}
                    placeholder="192.168.1.100, 10.0.0.50"
                  />
                </div>
                <div>
                  <Label htmlFor="customHeaders">Custom Headers (JSON)</Label>
                  <Input
                    id="customHeaders"
                    value={stage2Form.customHeaders}
                    onChange={(e) => setStage2Form({...stage2Form, customHeaders: e.target.value})}
                    placeholder='{"X-Forwarded-For": "original"}'
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="keepAlive"
                    checked={stage2Form.keepAlive}
                    onCheckedChange={(checked) => setStage2Form({...stage2Form, keepAlive: checked})}
                  />
                  <Label htmlFor="keepAlive">Keep Alive Connections</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sslEnabled"
                    checked={stage2Form.sslEnabled}
                    onCheckedChange={(checked) => setStage2Form({...stage2Form, sslEnabled: checked})}
                  />
                  <Label htmlFor="sslEnabled">SSL/TLS Support</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rotateOnDisconnect"
                    checked={stage2Form.rotateOnDisconnect}
                    onCheckedChange={(checked) => setStage2Form({...stage2Form, rotateOnDisconnect: checked})}
                  />
                  <Label htmlFor="rotateOnDisconnect">Rotate IP on Disconnect</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowStage2Dialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignPortsMutation.isPending}>
                {assignPortsMutation.isPending ? 'Assigning...' : 'Assign Ports & Generate OpenVPN'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modems Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Modems</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Name</th>
                  <th className="border border-gray-300 p-2 text-left">IMEI</th>
                  <th className="border border-gray-300 p-2 text-left">Status</th>
                  <th className="border border-gray-300 p-2 text-left">Stage</th>
                  <th className="border border-gray-300 p-2 text-left">Ports</th>
                  <th className="border border-gray-300 p-2 text-left">Auto IP</th>
                  <th className="border border-gray-300 p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modemsLoading ? (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 p-4 text-center">
                      Loading modems...
                    </td>
                  </tr>
                ) : modems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 p-4 text-center">
                      No modems registered. Click "Stage 1: Register Modem" to add your first modem.
                    </td>
                  </tr>
                ) : (
                  modems.map((modem: Modem) => {
                    const configs = getProxyConfigsForModem(modem.id);
                    return (
                      <tr key={modem.id} style={{ backgroundColor: getStatusColor(modem.status) }}>
                        <td className="border border-gray-300 p-2">
                          <strong>{modem.name}</strong>
                        </td>
                        <td className="border border-gray-300 p-2">{modem.imei}</td>
                        <td className="border border-gray-300 p-2">
                          <strong>{modem.status.toUpperCase()}</strong>
                        </td>
                        <td className="border border-gray-300 p-2">
                          {modem.portsAssigned ? (
                            <span className="text-green-600 font-semibold">Stage 2 Complete</span>
                          ) : (
                            <span className="text-orange-600 font-semibold">Stage 1 Complete</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {configs.length > 0 ? (
                            <div>
                              {configs.map((config: ProxyConfig) => (
                                <div key={config.id} className="text-sm">
                                  <span className="font-bold text-blue-600">{config.httpPort}</span> (HTTP)
                                  <br />
                                  <span className="font-bold text-blue-600">{config.socksPort}</span> (SOCKS)
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">No ports assigned</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {modem.autoIpRotation ? (
                            <span className="text-green-600">✓ {modem.ipRotationInterval}min</span>
                          ) : (
                            <span className="text-gray-500">Disabled</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-2">
                          <div className="flex space-x-1">
                            {!modem.portsAssigned && (
                              <Button
                                size="sm"
                                onClick={() => openStage2Dialog(modem)}
                                className="text-xs"
                              >
                                <Settings className="w-3 h-3 mr-1" />
                                Stage 2
                              </Button>
                            )}
                            {modem.openvpnConfigUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadOpenVPNConfig(modem)}
                                className="text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                OpenVPN
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rotateIpMutation.mutate(modem.id)}
                              disabled={rotateIpMutation.isPending}
                              className="text-xs"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Rotate IP
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rebootMutation.mutate(modem.id)}
                              disabled={rebootMutation.isPending}
                              className="text-xs"
                            >
                              <Power className="w-3 h-3 mr-1" />
                              Reboot
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}