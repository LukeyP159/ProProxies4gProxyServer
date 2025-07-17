import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const ApiEndpoints = () => {
  const { toast } = useToast();

  const testEndpoint = async (endpoint: string, method: string = 'GET', data?: any) => {
    try {
      const response = await apiRequest(method, endpoint, data);
      const result = await response.json();
      
      toast({
        title: "API Test Success",
        description: `${method} ${endpoint} returned ${response.status}`,
      });
      
      console.log('API Response:', result);
    } catch (error) {
      toast({
        title: "API Test Failed",
        description: `${method} ${endpoint} failed`,
        variant: "destructive",
      });
      
      console.error('API Error:', error);
    }
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/modems/1/rotate',
      description: 'Rotate IP address for specific modem',
      testData: null
    },
    {
      method: 'GET',
      path: '/api/modems',
      description: 'Get status of all modems',
      testData: null
    },
    {
      method: 'POST',
      path: '/api/vpn/generate',
      description: 'Generate OpenVPN config',
      testData: { modemId: 1, clientName: 'test-client' }
    },
    {
      method: 'GET',
      path: '/api/analytics',
      description: 'Get usage analytics',
      testData: null
    }
  ];

  return (
    <Card className="bg-surface shadow">
      <CardHeader>
        <div>
          <CardTitle className="text-lg font-semibold text-gray-800">API Quick Actions</CardTitle>
          <p className="text-sm text-gray-500">Common API endpoints</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-gray-800">
                  {endpoint.method} {endpoint.path}
                </span>
                <Button
                  size="sm"
                  onClick={() => testEndpoint(endpoint.path, endpoint.method, endpoint.testData)}
                >
                  Test
                </Button>
              </div>
              <p className="text-xs text-gray-500">{endpoint.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Link href="/api">
            <a className="text-sm text-primary hover:text-blue-600 flex items-center">
              <Book className="h-4 w-4 mr-2" />
              View full API documentation
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiEndpoints;
