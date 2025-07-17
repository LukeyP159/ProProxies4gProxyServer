import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, RefreshCw } from "lucide-react";

const Configuration = () => {
  const handleRefresh = () => {
    console.log('Refreshing configuration...');
  };

  const handleSave = () => {
    console.log('Saving configuration...');
  };

  return (
    <div>
      <Header
        title="Configuration"
        subtitle="Manage system and proxy configurations"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6">
        <Tabs defaultValue="proxy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="proxy">Proxy Settings</TabsTrigger>
            <TabsTrigger value="vpn">VPN Settings</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="proxy" className="space-y-6">
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>HTTP Proxy Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="http-port">HTTP Port</Label>
                    <Input id="http-port" type="number" placeholder="8080" />
                  </div>
                  <div>
                    <Label htmlFor="socks-port">SOCKS5 Port</Label>
                    <Input id="socks-port" type="number" placeholder="1080" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="auth-enabled" />
                  <Label htmlFor="auth-enabled">Enable Authentication</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="proxy-username">Username</Label>
                    <Input id="proxy-username" placeholder="username" />
                  </div>
                  <div>
                    <Label htmlFor="proxy-password">Password</Label>
                    <Input id="proxy-password" type="password" placeholder="password" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vpn" className="space-y-6">
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>OpenVPN Server Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vpn-port">OpenVPN Port</Label>
                    <Input id="vpn-port" type="number" placeholder="1194" />
                  </div>
                  <div>
                    <Label htmlFor="vpn-protocol">Protocol</Label>
                    <Input id="vpn-protocol" placeholder="udp" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="vpn-network">VPN Network</Label>
                  <Input id="vpn-network" placeholder="10.8.0.0/24" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="vpn-compression" />
                  <Label htmlFor="vpn-compression">Enable Compression</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="log-level">Log Level</Label>
                    <Input id="log-level" placeholder="info" />
                  </div>
                  <div>
                    <Label htmlFor="max-connections">Max Connections</Label>
                    <Input id="max-connections" type="number" placeholder="1000" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="auto-restart" />
                  <Label htmlFor="auto-restart">Auto Restart on Failure</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="health-check" />
                  <Label htmlFor="health-check">Enable Health Checks</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="api-auth" />
                  <Label htmlFor="api-auth">Enable API Authentication</Label>
                </div>
                
                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <Input id="api-key" placeholder="Generated API key" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="ssl-enabled" />
                  <Label htmlFor="ssl-enabled">Enable SSL/TLS</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ssl-cert">SSL Certificate Path</Label>
                    <Input id="ssl-cert" placeholder="/path/to/cert.pem" />
                  </div>
                  <div>
                    <Label htmlFor="ssl-key">SSL Key Path</Label>
                    <Input id="ssl-key" placeholder="/path/to/key.pem" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Configuration;
