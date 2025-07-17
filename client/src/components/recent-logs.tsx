import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SystemLog } from "@shared/schema";

const RecentLogs = () => {
  const { data: logs, isLoading } = useQuery<SystemLog[]>({
    queryKey: ['/api/logs'],
    refetchInterval: 30000,
  });

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-success';
      case 'warn':
        return 'bg-warning';
      case 'error':
        return 'bg-error';
      default:
        return 'bg-primary';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (isLoading) {
    return (
      <Card className="bg-surface shadow">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
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
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
          <Link href="/logs">
            <a className="text-sm text-primary hover:text-blue-600">View all logs</a>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs?.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start space-x-3">
              <Circle className={`w-2 h-2 ${getLogColor(log.level)} rounded-full mt-2 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-800 truncate">{log.message}</p>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTimeAgo(log.createdAt)}
                  </span>
                </div>
                {log.details && (
                  <p className="text-xs text-gray-500 truncate">{log.details}</p>
                )}
              </div>
            </div>
          ))}
          {!logs?.length && (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentLogs;
