import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Calendar, TrendingUp } from "lucide-react";

const Analytics = () => {
  const handleRefresh = () => {
    console.log('Refreshing analytics...');
  };

  const handleExport = () => {
    console.log('Exporting analytics...');
  };

  return (
    <div>
      <Header
        title="Analytics"
        subtitle="Detailed analytics and usage statistics"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6">
        <div className="flex justify-end mb-6">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bandwidth">Bandwidth</TabsTrigger>
            <TabsTrigger value="rotations">IP Rotations</TabsTrigger>
            <TabsTrigger value="vpn">VPN Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-surface shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Data Usage</p>
                      <p className="text-2xl font-bold text-gray-800">2.4 TB</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-success" />
                  </div>
                  <p className="text-xs text-success mt-2">+12% from last month</p>
                </CardContent>
              </Card>
              
              <Card className="bg-surface shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Uptime</p>
                      <p className="text-2xl font-bold text-gray-800">99.8%</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-xs text-success mt-2">Excellent reliability</p>
                </CardContent>
              </Card>
              
              <Card className="bg-surface shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Speed</p>
                      <p className="text-2xl font-bold text-gray-800">45 MB/s</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-warning" />
                  </div>
                  <p className="text-xs text-warning mt-2">Stable performance</p>
                </CardContent>
              </Card>
              
              <Card className="bg-surface shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Peak Usage</p>
                      <p className="text-2xl font-bold text-gray-800">89 MB/s</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-error" />
                  </div>
                  <p className="text-xs text-error mt-2">Today at 2:30 PM</p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>Usage Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-3xl mb-2">📊</div>
                    <p className="text-sm text-gray-400">Usage timeline chart</p>
                    <p className="text-xs text-gray-300 mt-1">Chart implementation pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bandwidth" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-surface shadow">
                <CardHeader>
                  <CardTitle>Bandwidth Usage by Modem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 text-3xl mb-2">📊</div>
                      <p className="text-sm text-gray-400">Per-modem bandwidth chart</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-surface shadow">
                <CardHeader>
                  <CardTitle>Peak Hours Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 text-3xl mb-2">⏰</div>
                      <p className="text-sm text-gray-400">Peak hours heatmap</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="rotations" className="space-y-6">
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>IP Rotation Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-3xl mb-2">🔄</div>
                    <p className="text-sm text-gray-400">IP rotation analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="vpn" className="space-y-6">
            <Card className="bg-surface shadow">
              <CardHeader>
                <CardTitle>VPN Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-3xl mb-2">🛡️</div>
                    <p className="text-sm text-gray-400">VPN connection analytics</p>
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

export default Analytics;
