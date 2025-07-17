import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Play, Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Api = () => {
  const { toast } = useToast();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/modems',
      description: 'Get all modems',
      response: `{
  "id": 1,
  "name": "Modem-001",
  "status": "connected",
  "publicIp": "203.0.113.45"
}`,
    },
    {
      method: 'POST',
      path: '/api/modems/{id}/rotate',
      description: 'Rotate IP address for a modem',
      response: `{
  "success": true,
  "oldIp": "203.0.113.45",
  "newIp": "203.0.113.46"
}`,
    },
    {
      method: 'GET',
      path: '/api/stats',
      description: 'Get dashboard statistics',
      response: `{
  "activeModems": 4,
  "totalBandwidth": 145,
  "totalRotations": 847,
  "activeVpnConnections": 12
}`,
    },
    {
      method: 'POST',
      path: '/api/vpn/generate',
      description: 'Generate OpenVPN configuration',
      response: `{
  "id": 1,
  "clientName": "vpn-client-001",
  "configPath": "/etc/openvpn/client001.conf",
  "status": "active"
}`,
    },
  ];

  const codeExamples = {
    javascript: `// JavaScript example
const response = await fetch('/api/modems/1/rotate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key'
  }
});

const data = await response.json();
console.log(data);`,
    
    python: `# Python example
import requests

url = 'http://localhost:5000/api/modems/1/rotate'
headers = {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
}

response = requests.post(url, headers=headers)
data = response.json()
print(data)`,
    
    curl: `# cURL example
curl -X POST http://localhost:5000/api/modems/1/rotate \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json"`
  };

  return (
    <div>
      <Header
        title="API Documentation"
        subtitle="Comprehensive API reference for 4G Proxy Server"
      />
      
      <div className="p-6">
        <Tabs defaultValue="endpoints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
          </TabsList>
          
          <TabsContent value="endpoints" className="space-y-6">
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {endpoints.map((endpoint, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(`${endpoint.method} ${endpoint.path}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{endpoint.description}</p>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-2">Response:</p>
                        <pre className="text-sm overflow-x-auto">
                          <code>{endpoint.response}</code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="examples" className="space-y-6">
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="javascript" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(codeExamples).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="bg-gray-900 text-white rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">{lang}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(code)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="text-sm overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="authentication" className="space-y-6">
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        All API requests require authentication using Bearer tokens.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Getting an API Key</h4>
                    <p className="text-sm text-gray-600">
                      API keys can be generated from the Configuration page under Security settings.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Using the API Key</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <code className="text-sm">
                        Authorization: Bearer your-api-key-here
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Rate Limiting</h4>
                    <p className="text-sm text-gray-600">
                      API requests are limited to 1000 requests per hour per API key.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Api;
