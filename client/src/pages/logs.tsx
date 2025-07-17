import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SystemLog } from "@shared/schema";
import { useState } from "react";

const Logs = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery<SystemLog[]>({
    queryKey: ['/api/logs'],
    refetchInterval: 10000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting logs...');
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'warn':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      case 'debug':
        return <Badge className="bg-gray-100 text-gray-800">Debug</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{level}</Badge>;
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  return (
    <div>
      <Header
        title="System Logs"
        subtitle="View and monitor system activity logs"
        onRefresh={handleRefresh}
      />
      
      <div className="p-6 space-y-6">
        <Card className="bg-surface shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">Filter & Search</CardTitle>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-800">
                System Logs
                {filteredLogs && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'})
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs?.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getLogLevelBadge(log.level)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatTimestamp(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-md truncate">
                            {log.message}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {log.source || '-'}
                            {log.sourceId && (
                              <span className="ml-1 text-xs text-gray-400">
                                (ID: {log.sourceId})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-md truncate">
                            {log.details || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredLogs?.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg mb-2">📄</div>
                    <p className="text-gray-500">No logs found</p>
                    <p className="text-sm text-gray-400">
                      {searchTerm || levelFilter !== "all" 
                        ? "Try adjusting your search or filter criteria" 
                        : "No system logs available"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Logs;
